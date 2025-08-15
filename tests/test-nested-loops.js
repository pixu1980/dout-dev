#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { TemplateEngine } from '../scripts/template-engine/index.js';

console.log('🔄 Testing Nested Loops...\n');

try {
    // Load simple test data
    const data = JSON.parse(readFileSync('./simple-test-data.json', 'utf-8'));
    console.log('✅ Test data loaded:');
    console.log(`   - ${data.posts.length} posts`);
    data.posts.forEach((post, i) => {
        console.log(`   - Post ${i + 1}: "${post.title}" (${post.tags.length} tags: ${post.tags.join(', ')})`);
    });
    console.log();

    // Initialize template engine
    const engine = new TemplateEngine('./');
    console.log('✅ Template Engine initialized\n');

    // Test simple nested loop
    console.log('🎨 Testing nested loop...');
    const startTime = Date.now();

    const result = engine.render('nested-loop-test.html', data);

    const endTime = Date.now();
    console.log(`✅ Template rendered in ${endTime - startTime}ms\n`);

    // Save result
    writeFileSync('./nested-loop-output.html', result);
    console.log('💾 Output saved to: nested-loop-output.html\n');

    // Display part of the result for inspection
    console.log('📋 Generated HTML (first 1000 chars):');
    console.log('=' .repeat(50));
    console.log(result.substring(0, 1000));
    if (result.length > 1000) {
        console.log('...');
    }
    console.log('=' .repeat(50));

    // Try to validate with prettier
    try {
        const { execSync } = await import('child_process');
        execSync('npx prettier --check nested-loop-output.html', { stdio: 'inherit' });
        console.log('\n✅ HTML is valid and well-formatted!');
    } catch (error) {
        console.log('\n⚠️  HTML formatting issues detected');
        console.log('Let\'s see the specific issue...\n');

        try {
            execSync('npx prettier --check nested-loop-output.html', { stdio: 'pipe' });
        } catch (prettierError) {
            console.log(prettierError.stdout?.toString() || prettierError.message);
        }
    }

} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
