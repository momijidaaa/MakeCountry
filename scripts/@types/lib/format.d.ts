/**
 * @beta
 * @author yuki2825624
 */
export declare class Formatter {
    private constructor();
    readonly set (formatName: string, callback: (input: string[]) => string): void;
    readonly get (formatName: string, input: string[]): string;
}