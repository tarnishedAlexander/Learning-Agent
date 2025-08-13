export class Classes {
    constructor (
        public readonly id: number,
        public name: string,
        public semester: string,
        public professorCode: number,
        public isActive: boolean,
        public dateBegin: Date,
        public dateEnd: Date,
    ) {}
}