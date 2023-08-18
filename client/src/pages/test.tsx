import { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

export const Test = () => {
  const editorRef = useRef(null);
  const [textInput, setTextInput] = useState("");
  // Editor value -> YJS Text Value (A text value shared by multiple people)
  // One person deletes text -> Deletes from overall shared text value
  // Handled by yjs
  const ydoc = new Y.Doc();
  // Initialize yjs, tell it to listen to our monaco instance for changes
  const ytext = ydoc.getText("my text type");
  // Method 2: Define Y.Text that can be included into the Yjs document
  const ytextNested = new Y.Text();
  // Nested types can be included as content into any other shared type
  ydoc.getMap("another shared structure").set("my nested text", ytextNested);
  // function handleEditorDidMount(editor: any, monaco: any) {
  //   editorRef.current = editor;
  //   // initialize yjs

  //   // connects to peers (or start connecton) with WebRTC
  //   const provider = new WebrtcProvider("test-room", ydoc);
  //   const type = ydoc.getText("monaco"); // ydoc { " monaco ": "whaat is in our IDE"}
  //   const binding = new MonacoBinding(
  //     type,
  //     editorRef.current.getModel(),
  //     new Set([editorRef.current]),
  //     provider.awareness
  //   );
  // }

  // function onKeyPress(event) {
  //   event.preventDefault();
  //   if (event.key === "Enter") {
  //     const target = event.target.value;
  //     ytext.insert(target);
  //   }
  //   console.log(ytext);
  // }

  return (
    <>
      <Editor
        height="50vh"
        width="50vw"
        theme="vs-dark"
        //onMount={handleEditorDidMount}
      />
      <div>
        <form>
          <label>Enter</label>
          <input
            type="text"
            placeholder="enter ur nuts here"
            // onKeyPress={onKeyPress}
          ></input>
          <div>{textInput}</div>
        </form>
      </div>
    </>
  );
};
