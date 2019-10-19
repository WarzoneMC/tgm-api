import { prop, Typegoose, ModelType, staticMethod } from '@hasezoey/typegoose';
import { COLLECTION_RANKS } from '../constants';

export class Rank extends Typegoose {

    @prop({ required: true })
    name!: string;

    @prop({ required: true })
    priority!: number;

    @prop({ required: true })
    prefix!: string;

    @prop({ required: true })
    permissions!: string[];

    @prop({ default: false })
    staff?: boolean;

    @prop({ default: false })
    default?: boolean;

    @staticMethod
    static async findByName(this: ModelType<Rank>, name: string) {
        return this.findOne({name: name.toLowerCase()});
    }
    
    @staticMethod
    static async findById(this: ModelType<Rank>, id: string) {
        return this.findOne({_id: id});
    }
    
}

export default new Rank().getModelForClass(Rank, {
    schemaOptions: {
        collection: COLLECTION_RANKS
    }
});
