import react from 'react';
import { Button } from 'react-bootstrap';
import { ImZoomIn } from "react-icons/im";

export default function Zoom(props) {
  const { handleZoomIn, handleZoomOut } = props;
  return (
    <div className='zoom-container'>
      <h5 className='m-1'><ImZoomIn />  Zoom</h5>
      <Button className='mr-1' variant='secondary' onClick={handleZoomOut}>-</Button>
      <Button className='ms-2' variant='secondary' onClick={handleZoomIn}>+</Button>
    </div>
  )
}
