const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

async function basicScrapeExample() {
  console.log('🕷️ Basic scraping example\n');

  try {
    // Simple scrape
    console.log('1. Simple scrape of a webpage...');
    const response = await axios.post(`${API_BASE}/scrape`, {
      url: 'https://example.com'
    });

    if (response.data.success) {
      console.log('✅ Scraping successful!');
      console.log(`📄 Title: ${response.data.data.title}`);
      console.log(`📝 Description: ${response.data.data.description}`);
      console.log(`📊 Words: ${response.data.data.metadata.wordCount}`);
      console.log(`🔗 Links found: ${response.data.data.links.length}`);
    } else {
      console.log('❌ Error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

async function batchScrapeExample() {
  console.log('\n🔄 Batch scraping example\n');

  try {
    const urls = [
      'https://httpbin.org/html',
      'https://httpbin.org/json',
      'https://httpbin.org/xml'
    ];

    console.log(`2. Scraping ${urls.length} URLs...`);
    const response = await axios.post(`${API_BASE}/scrape/batch`, {
      urls: urls,
      options: {
        includeMarkdown: true,
        includeHtml: false
      }
    });

    if (response.data.success) {
      console.log('✅ Batch scraping successful!');
      console.log(`📊 Total: ${response.data.data.summary.total}`);
      console.log(`✅ Successful: ${response.data.data.summary.successful}`);
      console.log(`❌ Failed: ${response.data.data.summary.failed}`);
      
      response.data.data.results.forEach((result, index) => {
        if (result.success) {
          console.log(`  ${index + 1}. ${result.data.url} - ✅`);
        } else {
          console.log(`  ${index + 1}. ${urls[index]} - ❌ ${result.error}`);
        }
      });
    } else {
      console.log('❌ Error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

async function crawlExample() {
  console.log('\n🔍 Crawling example\n');

  try {
    console.log('3. Starting crawl...');
    const crawlResponse = await axios.post(`${API_BASE}/crawl`, {
      url: 'https://httpbin.org',
      options: {
        maxPages: 5,
        maxDepth: 2,
        includeMarkdown: true
      }
    });

    if (crawlResponse.data.success) {
      const jobId = crawlResponse.data.data.id;
      console.log(`✅ Crawl started! Job ID: ${jobId}`);
      
      // Monitor progress
      let completed = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds maximum

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await axios.get(`${API_BASE}/crawl/${jobId}`);
        
        if (statusResponse.data.success) {
          const job = statusResponse.data.data;
          console.log(`📊 Status: ${job.status} | Progress: ${job.progress.completed}/${job.progress.total}`);
          
          if (job.status === 'completed') {
            completed = true;
            console.log('✅ Crawl completed!');
            console.log(`📄 Total pages: ${job.results.length}`);
            console.log(`✅ Successful: ${job.results.filter(r => r.success).length}`);
            console.log(`❌ Failed: ${job.results.filter(r => !r.success).length}`);
          } else if (job.status === 'failed') {
            completed = true;
            console.log('❌ Crawl failed');
          }
        }
        
        attempts++;
      }
      
      if (!completed) {
        console.log('⏰ Timeout waiting for crawl');
      }
    } else {
      console.log('❌ Error starting crawl:', crawlResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

async function runExamples() {
  console.log('🔥 Web Scraper API Examples\n');
  console.log('Make sure the server is running at http://localhost:3002\n');

  // Check that API is available
  try {
    await axios.get('http://localhost:3002/health');
    console.log('✅ API is available\n');
  } catch (error) {
    console.log('❌ API not available. Start the server first.');
    console.log('   npm run start:dev\n');
    return;
  }

  await basicScrapeExample();
  await batchScrapeExample();
  await crawlExample();
  
  console.log('\n🎉 All examples completed!');
}

// Run if called directly
if (require.main === module) {
  runExamples().catch(console.error);
}

module.exports = {
  basicScrapeExample,
  batchScrapeExample,
  crawlExample,
  runExamples
};