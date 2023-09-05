import { useState } from "react";
import React from "react";
import Table from 'react-bootstrap/Table'
import { ListItem2 } from "./listItem new";
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export const List = (props: { data: any; }) => {

  const ydoc = new Y.Doc()
  const yarray = ydoc.getArray('array') 
  let counter = 0;
  yarray.insert(counter, props.data);
  const [itemList, setItemList] = useState(props.data);
  yarray.insert(counter, itemList);
  
  yarray.observe(event => {
    // Log a delta every time the type changes
    // Learn more about the delta format here: https://quilljs.com/docs/delta/
    console.log('delta:', event.changes.delta)
  })
  
  const addListItem = ()=>{
    setItemList([...itemList, {name: 'test', required: false, available: 1, cost: 10, assignees: []}])
    counter+=1
    yarray.insert(0, itemList);
  }

  const clearListItem = ()=> {
    setItemList([])
    counter = 0;
  }
  

  return (
  <>
  <Table bgcolor="gray" >
      <thead>
        <tr>
          <th>Item</th>
          <th>Required</th>
          <th>Available</th>
          <th>Cost</th>
          <th>Who</th>
        </tr>
      </thead>
      <tbody>
        {itemList.map((item: { name: any; require: any; available: any; cost: any; who: any; }, idx: React.Key | null | undefined) => 
          <ListItem2 name={item?.name ||''} required={item?.require || false} available={item?.available || 0} cost={item?.cost || 0} assignees={item?.who}/>
        )} 
      </tbody>
    <div>
      {JSON.stringify(yarray.toArray())}
    </div>
    <div>
      <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-4 rounded" onClick={addListItem}>
      add new item
    </button>
    <button className="bg-gray-900 hover:bg-gray-800 text-white text-lg font-bold py-2 px-4 rounded" onClick={clearListItem}>
      clear new item
    </button>
  </div>
       
  </Table>
  
  </>

  );
  
};
