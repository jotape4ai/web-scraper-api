import { WebScraperApiClient } from '../sdk/src/index';

/**
 * 🔥 Web Scraper API SDK Usage Examples
 * 
 * This file shows how to use the TypeScript SDK to interact
 * with the Web Scraper API programmatically.
 */

async function basicExample() {
  console.log('🕷️ Basic scraping example\n');

  // Create client
  const client = new WebScraperApiClient({
    baseUrl: 'http://localhost:3002',
    timeout: 30000,
  });

  try {
    // Check that API is available
    const health = await client.health();
    console.log('✅ API available:', health.message);

    // Simple scrape
    const result = await client.scrape('https://example.com', {
      includeMarkdown: true,
      onlyMainContent: true,
    });

    if (result.success && result.data) {
      console.log(`📄 Title: ${result.data.title}`);
      console.log(`📝 Description: ${result.data.description}`);
      console.log(`📊 Words: ${result.data.metadata?.wordCount}`);
      console.log(`🔗 Links: ${result.data.links?.length}`);
      console.log(`\n📋 Content (first 200 chars):`);
      console.log(result.data.markdown?.substring(0, 200) + '...');
    } else {
      console.log('❌ Error:', result.error);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function batchExample() {
  console.log('\n🔄 Batch scraping example\n');

  const client = new WebScraperApiClient();

  try {
    const urls = [
      'https://httpbin.org/html',
      'https://httpbin.org/json',
      'https://example.com',
    ];

    const result = await client.scrapeBatch(urls, {
      includeMarkdown: true,
    });

    console.log(`📊 Summary: ${result.summary.successful}/${result.summary.total} successful`);
    
    result.results.forEach((res, index) => {
      if (res.success && res.data) {
        console.log(`  ${index + 1}. ${res.data.url} - ✅ (${res.data.metadata?.wordCount} words)`);
      } else {
        console.log(`  ${index + 1}. ${urls[index]} - ❌ ${res.error}`);
      }
    });

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function crawlingExample() {
  console.log('\n🌐 Complete crawling example\n');

  const client = new WebScraperApiClient();

  try {
    // Start crawl
    console.log('🚀 Starting crawl...');
    const jobId = await client.startCrawl('https://httpbin.org', {
      maxPages: 5,
      maxDepth: 2,
      includeMarkdown: true,
    });

    console.log(`📋 Job ID: ${jobId}`);

    // Monitor progress
    let completed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!completed && attempts < maxAttempts) {
      const job = await client.getCrawlStatus(jobId);
      console.log(`📊 Status: ${job.status} | Progress: ${job.progress.completed}/${job.progress.total}`);
      
      if (job.status === 'completed') {
        completed = true;
        console.log('✅ Crawl completed!');
        console.log(`📄 Total pages: ${job.results.length}`);
        console.log(`✅ Successful: ${job.results.filter(r => r.success).length}`);
        console.log(`❌ Failed: ${job.progress.failed}`);
        
        // Show results
        job.results.slice(0, 3).forEach((result, index) => {
          if (result.success && result.data) {
            console.log(`  ${index + 1}. ${result.data.title} - ${result.data.metadata?.wordCount} words`);
          }
        });
        
      } else if (job.status === 'failed') {
        completed = true;
        console.log('❌ Crawl failed');
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      attempts++;
    }

    if (!completed) {
      console.log('⏰ Timeout waiting for crawl');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function advancedExample() {
  console.log('\n⚙️ Advanced example with custom options\n');

  const client = new WebScraperApiClient({
    baseUrl: 'http://localhost:3002',
    timeout: 45000,
  });

  try {
    // Scrape with advanced options
    const result = await client.scrape('https://news.ycombinator.com', {
      includeMarkdown: true,
      includeHtml: false,
      onlyMainContent: true,
      waitFor: 2000,
      excludeSelectors: ['.comment', '.reply', '.ads'],
      userAgent: 'ScrapeBot/1.0',
    });

    if (result.success && result.data) {
      console.log(`📄 ${result.data.title}`);
      console.log(`⏱️  Load time: ${result.data.metadata?.loadTime}ms`);
      console.log(`📊 Status code: ${result.data.metadata?.statusCode}`);
      console.log(`🔗 Links found: ${result.data.links?.length}`);
      
      // Show some links
      if (result.data.links && result.data.links.length > 0) {
        console.log('\n🔗 First 5 links:');
        result.data.links.slice(0, 5).forEach((link, i) => {
          console.log(`  ${i + 1}. ${link}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function errorHandlingExample() {
  console.log('\n🛡️ Error handling example\n');

  const client = new WebScraperApiClient();

  // URLs with different states
  const testUrls = [
    'https://httpbin.org/status/200',  // OK
    'https://httpbin.org/status/404',  // Not Found
    'https://url-that-does-not-exist.com',   // DNS Error
    'https://httpbin.org/delay/10',    // Timeout
  ];

  for (const url of testUrls) {
    try {
      console.log(`🔍 Testing: ${url}`);
      
      const result = await client.safeScrape(url, {
        timeout: 5000, // 5 seconds
      });

      if (result.success) {
        console.log(`  ✅ Successful - ${result.data?.metadata?.statusCode}`);
      } else {
        console.log(`  ❌ Error: ${result.error}`);
      }

    } catch (error) {
      console.log(`  💥 Exception: ${error.message}`);
    }
  }
}

// Run all examples
async function runExamples() {
  console.log('🔥 Web Scraper API SDK Examples\n');
  console.log('Make sure the API is running at http://localhost:3002\n');

  try {
    await basicExample();
    await batchExample();
    await crawlingExample();
    await advancedExample();
    await errorHandlingExample();
    
    console.log('\n🎉 All examples completed!');
    
  } catch (error) {
    console.error('💥 General error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  runExamples();
}

export {
  basicExample,
  batchExample,  
  crawlingExample,
  advancedExample,
  errorHandlingExample,
  runExamples,
};