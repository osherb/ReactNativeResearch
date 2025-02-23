import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

const App: React.FC = () => {
  useEffect(() => {
      const jsCode = `
          console.log('Eval Hook Test!!!');
          var injected_var = 'This is from eval';
          console.log(injected_var);
          function testFunc() { return 'test'; }
          testFunc();
      `;
      eval(jsCode);
  }, []);


    return (
        <View>
            <Text>Hello, React Native!</Text>
        </View>
    );
};

export default App;
