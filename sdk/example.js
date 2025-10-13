const { OpenFlagClient } = require('./src/index');

async function main() {
  // Create OpenFlag client
  const client = new OpenFlagClient({
    apiUrl: 'http://localhost:8000',
    cacheTTL: 30000, // 30 seconds
    refreshInterval: 0, // Disabled for this example
    onError: (error) => {
      console.error('❌ Error:', error.message);
    }
  });

  console.log('🚩 OpenFlag SDK Example\n');

  try {
    // Example 1: Get a boolean flag
    console.log('1. Boolean flag:');
    const darkMode = await client.getFlag('dark_mode', false);
    console.log('   dark_mode =', darkMode);
    console.log('');

    // Example 2: Check if feature is enabled
    console.log('2. Check if enabled:');
    const isEnabled = await client.isEnabled('dark_mode', false);
    console.log('   Is dark mode enabled?', isEnabled);
    console.log('');

    // Example 3: Get a string flag
    console.log('3. String flag:');
    const apiUrl = await client.getFlag('api_url', 'https://default.com');
    console.log('   api_url =', apiUrl);
    console.log('');

    // Example 4: Get a number flag
    console.log('4. Number flag:');
    const maxRetries = await client.getFlag('max_retries', 3);
    console.log('   max_retries =', maxRetries);
    console.log('');

    // Example 5: Get all flags
    console.log('5. Get all flags:');
    const allFlags = await client.getAllFlags();
    console.log(`   Total flags: ${allFlags.length}`);
    allFlags.forEach(flag => {
      console.log(`   - ${flag.key}: ${flag.value} (${flag.type})`);
    });
    console.log('');

    // Example 6: Caching demonstration
    console.log('6. Cache demonstration:');
    console.log('   First call (hits API)...');
    const time1 = Date.now();
    await client.getFlag('dark_mode');
    console.log(`   Took ${Date.now() - time1}ms`);
    
    console.log('   Second call (from cache)...');
    const time2 = Date.now();
    await client.getFlag('dark_mode');
    console.log(`   Took ${Date.now() - time2}ms`);
    console.log('');

    // Example 7: Fallback when flag doesn't exist
    console.log('7. Fallback for non-existent flag:');
    const nonExistent = await client.getFlag('does_not_exist', 'fallback_value');
    console.log('   does_not_exist =', nonExistent);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Cleanup
    client.destroy();
    console.log('\n✅ Done!');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
