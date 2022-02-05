declare class MonkeyConfig {
    constructor(config: any)
    public get<T = any>(param: string): T
}