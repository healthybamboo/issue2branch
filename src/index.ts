import OpenAI from 'openai';
import { makeUserPrompt, Prompt, sendPrompt, SYSTEM_PROMPT } from '@/libs/llm';
import { Toolkit } from 'actions-toolkit';


/**
 * ブランチ名を生成する関数。
 * 
 * @param openAiKey OpenAIのAPIキー
 * @param labels issueのラベル
 * @param title issueのタイトル
 * @param number issueの番号
 * @returns ブランチ名
 */
async function generateBranch(openAiKey: string, labels: string[], title: string, number: number): Promise<string> {
    // ブランチ名を生成
    const client = new OpenAI({
        apiKey: openAiKey,
    })

    const prompts: Prompt[] = [
        {
            role: 'system', content: SYSTEM_PROMPT
        },
        {
            role: 'user', content: makeUserPrompt(labels, title, number).content
        }
    ]
    const branch_name = await sendPrompt(client, prompts);
    if (!branch_name) {
        throw new Error('Branch name is undefined');
    }

    return branch_name;
}

Toolkit.run(
    async (tools) => {
        try {
            // Get the OpenAI API key from the inputs
            const openAiKey = tools.inputs.openai_api_key;

            // Get the labels, title, and number from the issue
            const issuelabels = tools.context.payload.issue?.labels.map((label: { name: string }) => label.name) || [];
            const issueTitle = tools.context.payload.issue?.title || '';
            const issueNumber = tools.context.payload.issue?.number || 0;
            tools.log.info('Labels:', issuelabels);
            tools.log.info('Title:', issueTitle);
            tools.log.info('Number:', issueNumber);
            // Check if the OpenAI API key is provided
            if (!openAiKey) {
                throw new Error('OpenAI API key is not provided');
            }
            // Generate the branch name
            const branchName = await generateBranch(openAiKey, issuelabels, issueTitle, issueNumber);

            // Create and push the branch
            const { exec } = tools;
            await exec('git', ['config', '--global', '--add', 'safe.directory', `${tools.workspace}`]);
            await exec('git', ['config', 'user.name', 'github-actions']);
            await exec('git', ['config', 'user.email', 'actions@github.com']);
            await exec('git', ['checkout', '-b', branchName]);
            await exec('git', ['push', 'origin', branchName]);

            // Output the branch name
            tools.log.info('Branch name:', branchName);
            tools.log.info('Branch created and pushed successfully');
            tools.exit.success(`Branch name: ${branchName}`);
        } catch (error) {
            tools.log.error('Error:', error);
            tools.exit.failure('Failure');
        }
    }
)