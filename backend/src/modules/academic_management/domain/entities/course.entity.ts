export class Course {
    constructor (
        public readonly id: string,
        public name: string,
        public isActive: boolean,
        public courseId: string
    ) {}
}