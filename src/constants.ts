import * as config from "./config.json";

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,16}$/;
export const PORT = config.port;
export const MONGO_URI = config.mongo;

export const COLLECTION_USERS = config.collections.users || "minecraft_users";
export const COLLECTION_RANKS = config.collections.ranks || "minecraft_ranks";
export const COLLECTION_PUNISHMENTS = config.collections.punishments || "minecraft_punishments";
export const COLLECTION_MATCHES = config.collections.matches || "minecraft_matches";
export const COLLECTION_MAPS = config.collections.maps || "minecraft_maps";

