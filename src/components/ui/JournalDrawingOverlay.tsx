import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';

interface JournalDrawingOverlayProps {
  visible: boolean;
  width: number;
  height: number;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  opacity?: number;
  lines: any[];
  setLines: (lines: any[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClose: () => void;
  onSave: (drawing: any) => void;
}

const JournalDrawingOverlay: React.FC<JournalDrawingOverlayProps> = ({
  visible,
  width,
  height,
  tool,
  color,
  size,
  opacity = 1,
  lines,
  setLines,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  onClose,
  onSave
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<any>(null);

  if (!visible) return null;

  const handleMouseDown = (e: any) => {
    if (e.evt) e.evt.preventDefault();
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      tool,
      points: [pos.x, pos.y],
      color: tool === 'pen' ? hexToRgba(color, opacity) : 'rgba(0,0,0,1)',
      size: size
    }]);
  };

  const handleMouseMove = (e: any) => {
    if (e.evt) e.evt.preventDefault();
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    const newLines = lines.slice(0, -1).concat(lastLine);
    setLines(newLines);
  };

  const handleMouseUp = (e?: any) => {
    if (e && e.evt) e.evt.preventDefault();
    setIsDrawing(false);
  };

  useEffect(() => {
    // Reset drawing state if overlay is closed
    if (!visible) setIsDrawing(false);
  }, [visible]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: width,
      height: height,
      zIndex: 1000,
      pointerEvents: 'auto',
      background: 'rgba(0,0,0,0.01)',
      touchAction: 'none'
    }}>
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto', background: 'transparent' }}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.size}
              tension={0.5}
              lineCap="round"
              globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

// Helper to convert hex color to rgba with opacity
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default JournalDrawingOverlay; 