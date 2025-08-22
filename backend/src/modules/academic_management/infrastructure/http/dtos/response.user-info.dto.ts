export class UserInfoDTO {
    constructor(
        public readonly userId: string,
        public code: string,
        public name: string,
        public lastname: string,
        public email: string,
        public isActive: boolean,
        public career?: string,
        public admissionYear?: number,
    ) {}
}
