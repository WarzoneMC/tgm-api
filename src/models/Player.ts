import { prop, Typegoose, ModelType, InstanceType } from '@hasezoey/typegoose';

class Player extends Typegoose {
	@prop({ required: true })
	_id!: string;

	@prop({ required: true })
	name!: string;

	@prop({ required: true })
	lastJoinDate!: number;

	@prop({ required: true })
	initialJoinDate!: number;

	@prop({ required: true })
	ips!: number[];

	@prop({ required: true })
	ranks!: string[];

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
}

export default new Player().getModelForClass(Player);
