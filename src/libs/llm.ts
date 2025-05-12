import OpenAI from "openai";

export const GPT_MODEL = "gpt-4o";
export const SYSTEM_PROMPT = `
これから入力されるGithubIssueのissue番号,ラベル,タイトルから考えられる適切なブランチ名を出力してください。
ブランチ名は「prefix」、「isssue番号」、「英語表記のブランチ名」の3つの要素から構成されます。
これら３つは、アンダースコア(_)で繋がれます。

prefixはラベルごとに次のように設定してください。
- 機能追加: feature/
- 不具合修正: fix/
- リファクタリング: refactor/
- ドキュメント: doc/
- テスト: test/
- 開発体験向上:dx/
- それ以外:other/
もし、ラベルが複数ある場合は、上記の記述順に従って、最初に見つかったラベルをprefixとして使用してください。

issue番号は#の後ろにissue番号が続くような形式にしてください。
123というissue番号があった場合、#123のような形式になります。

英語表記のブランチ名は、issueのタイトル、ラベルなどから考えられるブランチ名を英語で表現してください。
また、英語表記のブランチ名は、アンダースコア(_)で繋いでください。
「チャットGPTのコードレビュー機能を追加する」というissueがあった場合、「add_chatgpt_code_review」のような形式になります。

最後に、これらを組み合わせた例をとしては以下の通りです。
- ラベル名: 機能追加
- issue番号: 123
- タイトル: チャットGPTのコードレビュー機能を追加する
の場合、ブランチ名は「feature/#123_add_chatgpt_code_review」のようになります。
`

/**
 * プロンプトを表す型
 */
export type Prompt = {
    /**
     * プロンプトの役割
     * - user: ユーザーからの入力
     * - system: システムからの入力
     * - assistant: アシスタントからの入力
     */
    role: 'user' | 'system' | 'assistant';
    /**
     * プロンプトの内容
     */
    content: string;
}

/**
 * ユーザープロンプトを作成します。
 * 
 * @param labels ラベルの配列
 * @param title イシューのタイトル
 * @param number イシューの番号
 * @returns ユーザープロンプト
 */
export function makeUserPrompt(labels: string[], title: string, number: number): Prompt {
    return {
        role: 'user',
        content: `labels: ${labels.join(', ')}, title: ${title}, number: ${number}`
    }
}

/**
 * プロンプトをLLMに送信します。
 * @param client OpenAIクライアントのインスタンス
 * @param prompts プロンプトの配列
 */
export async function sendPrompt(client: OpenAI, prompts: Prompt[]): Promise<string | undefined> {
    try {
        const response = await client.chat.completions.create({
            model: GPT_MODEL,
            messages: prompts.map(prompt => ({
                role: prompt.role,
                content: prompt.content,
            })),
        });
        return response.choices[0].message.content ?? undefined;
    } catch (error) {
        console.error('Error sending prompt:', error);
        return undefined;
    }
}

