const fs = require('fs');
const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = \`      {gameStarted && (
              {/* Inspector Modal */}\`;
const newCode = \`      {gameStarted && (
        <>
            {/* Inspector Modal */}\`;

content = content.replace(oldCode, newCode);

const oldCode2 = \`          setMaxCars={setMaxCars}
        />
      )}\`;
const newCode2 = \`          setMaxCars={setMaxCars}
        />
        </>
      )}\`;

content = content.replace(oldCode2, newCode2);
fs.writeFileSync(path, content);
console.log("Fixed JSX syntax error");
