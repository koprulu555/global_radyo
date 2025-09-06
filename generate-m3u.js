const axios = require('axios');
const fs = require('fs');

async function generateM3U() {
  try {
    console.log('Fetching radio stations...');
    const response = await axios.get('http://de1.api.radio-browser.info/json/stations?hidebroken=true&order=votes&reverse=true', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const stations = response.data;
    console.log(`Fetched ${stations.length} stations`);
    
    // Ülkeleri grupla
    const countries = {};
    stations.forEach(station => {
      if (!station.country || !station.name || !station.url) return;
      
      const country = station.country.trim();
      if (!countries[country]) {
        countries[country] = [];
      }
      
      // URL doğrulama ve düzeltme
      let streamUrl = station.url;
      if (streamUrl.includes('.pls')) {
        // .pls uzantılı URL'ler için özel işlem
        streamUrl = streamUrl.replace('http://', 'https://').replace('.pls', '.m3u');
      }
      
      // Geçerli bir URL olduğundan emin ol
      try {
        new URL(streamUrl);
        countries[country].push({
          name: station.name.trim(),
          url: streamUrl,
          logo: station.favicon || station.logo || '',
          country: country
        });
      } catch (e) {
        console.log('Invalid URL skipped:', streamUrl);
      }
    });
    
    // M3U çıktısını oluştur
    let m3uOutput = '#EXTM3U x-tvg-url=""\n\n';
    
    // Ülke kategorilerine göre sırala ve ekle
    Object.keys(countries).sort().forEach(country => {
      // Ülke başlığı
      m3uOutput += `#EXTINF:-1 tvg-id="" tvg-logo="" group-title="${country}",${country}\n`;
      m3uOutput += `#EXTGRP:${country}\n\n`;
      
      // Bu ülkedeki istasyonları ekle
      countries[country].forEach((station, index) => {
        const safeName = station.name.replace(/"/g, '\\"');
        const logo = station.logo ? station.logo.replace(/"/g, '\\"') : '';
        
        m3uOutput += `#EXTINF:-1 tvg-id="${station.country}_${index}" tvg-name="${safeName}" tvg-logo="${logo}" group-title="${station.country}",${safeName}\n`;
        m3uOutput += `#EXTVLCOPT:http-user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"\n`;
        m3uOutput += `${station.url}\n\n`;
      });
    });
    
    // Dosyaya yaz
    fs.writeFileSync('global_radio.m3u', m3uOutput);
    console.log('M3U file generated successfully');
    
  } catch (error) {
    console.error('Error generating M3U:', error.message);
    process.exit(1);
  }
}

generateM3U();
