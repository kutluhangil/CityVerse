const fs = require('fs');
const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `        if (Math.random() > 0.8) {
           const choices: ('sunny' | 'rainy' | 'snowy')[] = ['sunny', 'sunny', 'rainy', 'snowy'];
           newWeather = choices[Math.floor(Math.random() * choices.length)];
        }`;

const replacement1 = `        if (Math.random() > 0.8) {
           const choices: ('sunny' | 'rainy' | 'snowy')[] = ['sunny', 'sunny', 'rainy', 'snowy'];
           const nextWeather = choices[Math.floor(Math.random() * choices.length)];
           if (nextWeather !== newWeather) {
               newWeather = nextWeather;
               if (newWeather === 'rainy' && Math.random() > 0.3) {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'Make sure to bring an umbrella today!'", type: 'neutral'});
               } else if (newWeather === 'snowy' && Math.random() > 0.3) {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'The snow is beautiful, but the roads are slippery.'", type: 'neutral'});
               } else if (newWeather === 'sunny' && prev.weather !== 'sunny') {
                   addNewsItem({id: Date.now().toString()+Math.random(), text: "Citizen: 'Finally, some clear skies!'", type: 'positive'});
               }
           }
        }`;

content = content.replace(target1, replacement1);

fs.writeFileSync(path, content);
console.log("Added weather news items");
