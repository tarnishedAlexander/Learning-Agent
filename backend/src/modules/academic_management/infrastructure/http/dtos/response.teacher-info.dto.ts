export class TeacherInfoDTO {
    constructor(
        public readonly userId: string,
        public name: string,
        public lastname: string,
        public email: string,
        public isActive: boolean,
        public academicUnit?: string,
        public title?: string,
        public bio?: string
    ) {}
}
