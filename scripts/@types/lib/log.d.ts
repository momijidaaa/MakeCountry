/**
 * @beta
 * @author yuki2825624
 */
export declare class Logger {
    private constructor ();
    log (message: any, ...optionalParams: any[]): void;
    warn (message: any, ...optionalParams: any[]): void;
    error (message: any, ...optionalParams: any[]): void;
    debug (message: any, ...optionalParams: any[]): void;
    timer (label: string): void;
    timerLog (label: string): number | undefined;
    timerEnd (label: string, log?: boolean): number | undefined;
    count (label: string): number;
    resetCount (label: string): void;
}