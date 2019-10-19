import {
	prop,
	arrayProp,
	Typegoose,
	ModelType,
	staticMethod,
	Ref
} from '@hasezoey/typegoose';

import { Map } from './Map';
import { Player } from './Player';

export class TeamMapping {
	@prop({ required: true })
	team!: string;

	@prop({ required: true, ref: Player })
	player!: Ref<Player>;
}

export class Match extends Typegoose {
	@prop({ required: true, ref: Map })
	map!: Ref<Map>;

	@prop({ required: true })
	initializedDate!: number;

	@prop()
	startedDate?: number;

	@prop()
	finishedDate?: number;

	@arrayProp({ required: true, itemsRef: Player })
	winners!: Ref<Player>[];

	@arrayProp({ required: true, itemsRef: Player })
	losers!: Ref<Player>[];

	@prop({ required: true })
	winningTeam!: string;

	@arrayProp({ required: true, items: TeamMapping })
	teamMappings!: TeamMapping[];

	@prop({ default: false })
	finished?: boolean;

	@staticMethod
	static async findById(this: ModelType<Match>, id: string) {
		return this.findOne({ _id: id })
			.populate('map winners losers')
			.exec();
	}
}

export default new Match().getModelForClass(Match);
