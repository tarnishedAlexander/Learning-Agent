export interface httpDTO {
    code: number;
    error: string;
    correlation_id: string;
    data: any;
    description: string;
    path: string;
}