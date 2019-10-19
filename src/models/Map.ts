import {
	prop,
	Typegoose,
	ModelType,
	staticMethod,
	arrayProp
} from '@hasezoey/typegoose';

export class Author {
	@prop()
	uuid?: string;

	@prop()
	username?: string;
}

export class Team {
	@prop({ required: true })
	id!: string;

	@prop()
	name?: string;

	@prop({ required: true })
	color!: string;

	@prop({ required: true })
	min!: number;

	@prop({ required: true })
	max!: number;
}

export class Map extends Typegoose {
	@prop({ required: true })
	name!: string;

	@prop({ required: true })
	nameLower!: string;

	@prop({ required: true })
	version!: string;

	@arrayProp({ items: Author })
	authors?: Author[];

	@prop({ required: true })
	gametype!: string;

	@prop()
	thumbnail?: string;

	@arrayProp({ items: Team })
	teams!: Team[];

	@staticMethod
	static async findById(this: ModelType<Map>, id: string) {
		return this.findOne({ _id: id });
	}
}

export default new Map().getModelForClass(Map);
