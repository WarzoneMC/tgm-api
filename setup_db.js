#!/bin/node
const r = require('rethinkdbdash')();
const dbName = process.env.DATABASE_NAME || 'warzone';

const setup = async () => {
	// Create database
	await r.dbCreate(dbName).run();
	console.log('Created database ' + dbName);

	// Create tables
	await r.db(dbName).tableCreate('players').run();
	console.log('Created players table');

	console.log('Done!');
};

setup();