#!/usr/bin/env node

// Script to regenerate all character profiles with updated photo layout
const mongoose = require('mongoose');
const Character = require('./models/Character');
const { generateCharacterProfile } = require('./utils/profileGenerator');

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://darkcityuser:cQG8U9M2pKxTkZ2@ac-hd9gp85-shard-00-02.eqetzhr.mongodb.net/dark-city-game?retryWrites=true&w=majority';

async function regenerateAllProfiles() {
    try {
        console.log('🔄 Connecting to database...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to database');

        // Find all approved characters
        const characters = await Character.find({ status: 'approved' });
        console.log(`📊 Found ${characters.length} approved characters`);

        let successCount = 0;
        let errorCount = 0;

        for (const character of characters) {
            try {
                console.log(`🖼️ Regenerating profile for: ${character.name}`);
                await generateCharacterProfile(character);
                successCount++;
                console.log(`✅ Successfully regenerated: ${character.name}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to regenerate ${character.name}:`, error.message);
            }
        }

        console.log('\n📈 Regeneration Summary:');
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        console.log(`📊 Total: ${characters.length}`);

    } catch (error) {
        console.error('💥 Error during regeneration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
        process.exit(0);
    }
}

// Run the regeneration
regenerateAllProfiles();
