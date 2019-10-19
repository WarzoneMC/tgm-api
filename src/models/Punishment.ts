import {
	prop,
	Typegoose,
	ModelType,
	Ref,
	staticMethod,
	instanceMethod
} from '@hasezoey/typegoose';

import { Player } from './Player';

export class Punishment extends Typegoose {
	@prop({ ref: Player })
	punished!: Ref<Player>;

	@prop({ ref: Player, required: false })
	punisher?: Ref<Player>;

	@prop({ required: true })
	type!: string;

	@prop({ required: false })
	reason?: string;

	@prop({ required: true })
	issued!: number;

	@prop({ required: true })
	expires!: number;

	@prop({ required: true })
	ip!: string;

	@prop({ required: false, default: false })
	ipPunishment?: boolean;

	@prop({ required: false, default: false })
	reverted?: boolean;

	@instanceMethod
	isActive(): boolean {
		if (this.reverted) return false;
		if (this.expires == -1) return true;
		return this.expires > Date.now();
	}

	@staticMethod
	static async findByPlayer(this: ModelType<Punishment>, player: Player) {
		return this.findOne({ punished: player['_id'] })
			.populate('punished punisher')
			.exec();
	}

	@staticMethod
	static async findById(this: ModelType<Punishment>, id: string) {
		return this.findOne({ _id: id })
			.populate('punished punisher')
			.exec();
	}
}

export default new Punishment().getModelForClass(Punishment, {
	schemaOptions: {
		toJSON: {
			transform: (doc, ret, options) => {
				ret.active = doc.isActive();
				return ret;
			}
		}
	}
});
