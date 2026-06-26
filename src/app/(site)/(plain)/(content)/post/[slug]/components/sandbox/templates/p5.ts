import { REACT_TEMPLATE, SandboxTemplate } from "@codesandbox/sandpack-react"

import { TemplateConfig } from "."

// This can be a partial since we're passing default values
export const p5Template: Partial<TemplateConfig> = {
  name: "p5",

  dependencies: {
    p5: "1.9.4"
  },
  extends: "react",

  ...(REACT_TEMPLATE as Partial<SandboxTemplate>),

  editableFiles: ["sketch.js", "app.css", "App.js"],
  activeFile: "sketch.js",

  files: {
    ...REACT_TEMPLATE.files,
    "app.css": {
      code: `body { margin: 0; padding: 0; overflow: hidden;}`
    },
    "App.js": {
      code: `import './app.css';
import React, { useRef, useEffect, useState } from 'react';
import p5 from 'p5';
import { sketch } from './sketch';

const App = () => {
  const sketchRef = useRef();
  

  useEffect(() => {
    const p5Instance = new p5(sketch, sketchRef.current);

    return () => {
      p5Instance.remove();
    };
  }, []);

  return <div ref={sketchRef} />;
};

export default App;
      `
    },

    "sketch.js": {
      code: ``
    }
  }
}
