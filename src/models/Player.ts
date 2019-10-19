import { prop, arrayProp, Typegoose, ModelType, Ref, staticMethod } from '@hasezoey/typegoose';
import { COLLECTION_USERS } from '../constants';

import { Rank } from './Rank';

export class Player extends Typegoose {

	@prop({ required: true })
	uuid!: string;

	@prop({ required: true })
	name!: string;

	@prop({ required: true })
	nameLower!: string;

	@prop()
	new?: boolean;

	@prop({ required: true })
	initialJoinDate!: number;

	@prop({ required: true })
	lastJoinDate!: number;

	@arrayProp({ required: true, items: Number })
	ips!: number[];

	@arrayProp({ itemsRef: Rank })
	ranks!: Ref<Rank>[];

	@prop({ required: true })
	matchesPlayed!: number;

	@prop({ required: true })
	wins!: number;

	@prop({ required: true })
	losses!: number;

	@prop({ required: true })
	kills!: number;

	@prop({ required: true })
	deaths!: number;

	@staticMethod
	static async findByName(this: ModelType<Player>, name: string) {
		return this.findOne({nameLower: name.toLowerCase()}).populate('ranks').exec();
	}

	@staticMethod
	static async findById(this: ModelType<Player>, id: string) {
		return this.findOne({_id: id}).populate('ranks').exec();
	}

}

export default new Player().getModelForClass(Player, {
	schemaOptions: {
		collection: COLLECTION_USERS,
		toJSON: {
			transform: (doc, ret, options) => {
				delete ret.ips;
				delete ret.matches;
				delete ret.punishments;
				return ret;
			}
		}
	}
});
