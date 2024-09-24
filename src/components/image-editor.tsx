"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toBlob, toPng } from "html-to-image";
import {
  ArrowRight,
  Copy,
  Download,
  Square,
  Text,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export default function ImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [padding, setPadding] = useState(39);
  const [inset, setInset] = useState(0);
  const [rounded, setRounded] = useState(16);
  const [shadow, setShadow] = useState(27);
  const [background, setBackground] = useState("#e0e0e0");
  const [ratio, setRatio] = useState("auto");
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [elements, setElements] = useState<
    Array<{
      type: string;
      x: number;
      y: number;
      content?: string;
      width?: number;
      height?: number;
      isEditing?: boolean;
    }>
  >([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [activeElement, setActiveElement] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editedImageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (e) => setImage(e.target?.result as string);
          reader.readAsDataURL(blob as Blob);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editedImageRef.current &&
        !editedImageRef.current.contains(e.target as Node)
      ) {
        setActiveElement(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveElement(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const backgroundColors = [
    { name: "Light", color: "#e0e0e0" },
    { name: "Dark", color: "#1e1e1e" },
    { name: "Blue", color: "#3b82f6" },
    { name: "Green", color: "#22c55e" },
    { name: "Purple", color: "#a855f7" },
  ];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1));

  const handleSave = async () => {
    if (!editedImageRef.current) return;
    const dataUrl = await toPng(editedImageRef.current);
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = dataUrl;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!editedImageRef.current) return;
    const blob = await toBlob(editedImageRef.current);
    if (blob) {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    }
  };

  const handleToolSelect = (tool: string) => {
    if (!image) return;
    setSelectedTool(tool === selectedTool ? null : tool);
    setActiveElement(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editedImageRef.current) return;
    const rect = editedImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });

    if (isDragging && activeElement !== null) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setElements(
        elements.map((el, i) =>
          i === activeElement ? { ...el, x: el.x + dx, y: el.y + dy } : el,
        ),
      );
      setDragStart({ x, y });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editedImageRef.current) return;
    const rect = editedImageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedTool === "text") {
      const newElement = {
        type: "text",
        x,
        y,
        content: "Text goes here",
        width: 200,
        height: 40,
        isEditing: true,
      };
      setElements([...elements, newElement]);
      setActiveElement(elements.length);
      setSelectedTool(null);
    } else if (selectedTool === "arrow" || selectedTool === "square") {
      setIsDrawing(true);
      setDrawStart({ x, y });
    } else if (activeElement !== null) {
      setIsDragging(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDrawing && !editedImageRef.current) return;
    const rect = editedImageRef.current!.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    if (isDrawing) {
      setElements([
        ...elements,
        {
          type: selectedTool!,
          x: drawStart.x,
          y: drawStart.y,
          width: endX - drawStart.x,
          height: endY - drawStart.y,
        },
      ]);
      setIsDrawing(false);
      setSelectedTool(null);
    }

    setIsDragging(false);
  };

  const handleElementClick = (index: number) => {
    setActiveElement(index);
  };

  const handleTextChange = (index: number, newContent: string) => {
    const newElements = [...elements];
    newElements[index].content = newContent;
    setElements(newElements);
  };

  const handleTextDoubleClick = (index: number) => {
    const newElements = [...elements];
    newElements[index].isEditing = true;
    setElements(newElements);
    setActiveElement(index);
  };

  const handleTextBlur = (index: number) => {
    const newElements = [...elements];
    newElements[index].isEditing = false;
    setElements(newElements);
  };

  return (
    <div className="flex flex-col h-screen bg-[#d0d0d0] text-[#333333] overflow-hidden font-sans">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-[#b0b0b0]">
          <div className="p-4 border-b border-[#b0b0b0] flex justify-center space-x-2">
            <Button
              variant={selectedTool === "text" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolSelect("text")}
              disabled={!image}
            >
              <Text className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "arrow" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolSelect("arrow")}
              disabled={!image}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === "square" ? "default" : "outline"}
              size="icon"
              onClick={() => handleToolSelect("square")}
              disabled={!image}
            >
              <Square className="h-4 w-4" />
            </Button>
          </div>
          <div
            className="flex-1 p-4 flex items-center justify-center overflow-hidden bg-[#f0f0f0] bg-opacity-50"
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            <div
              ref={containerRef}
              className="relative overflow-auto max-w-full max-h-full"
            >
              <div
                ref={editedImageRef}
                className="inline-block origin-top-left transition-transform shadow-lg relative"
                style={{
                  padding: `${padding}px`,
                  backgroundColor: background,
                  transform: `scale(${zoom})`,
                  cursor:
                    selectedTool === "text"
                      ? "text"
                      : selectedTool
                        ? "crosshair"
                        : "default",
                }}
              >
                {image ? (
                  <img
                    ref={imageRef}
                    src={image}
                    alt="Uploaded"
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                    style={{
                      borderRadius: `${rounded}px`,
                      boxShadow: `0 0 ${shadow}px rgba(0,0,0,0.5)`,
                    }}
                  />
                ) : (
                  <div className="w-64 h-64 bg-[#c0c0c0] rounded-lg flex flex-col items-center justify-center">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload Image
                    </Button>
                    <p className="mt-2 text-sm text-[#555555]">
                      or paste from clipboard
                    </p>
                  </div>
                )}
                {elements.map((element, index) => (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      cursor: element.type === "text" ? "grab" : "default",
                      border:
                        activeElement === index && !element.isEditing
                          ? "2px dashed blue"
                          : "none",
                      transition: "border 0.3s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleElementClick(index);
                    }}
                    onDoubleClick={() =>
                      element.type === "text" && handleTextDoubleClick(index)
                    }
                  >
                    {element.type === "text" &&
                      (element.isEditing ? (
                        <textarea
                          ref={textareaRef}
                          value={element.content}
                          onChange={(e) =>
                            handleTextChange(index, e.target.value)
                          }
                          onBlur={() => handleTextBlur(index)}
                          className="w-full h-full outline-none border-2 border-blue-500 p-1 resize-none"
                          style={{
                            background: "transparent",
                            color: "inherit",
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {element.content}
                        </div>
                      ))}
                    {element.type === "arrow" && (
                      <svg width={element.width} height={element.height}>
                        <line
                          x1="0"
                          y1="0"
                          x2={element.width}
                          y2={element.height}
                          stroke="black"
                          markerEnd="url(#arrowhead)"
                        />
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="0"
                            refY="3.5"
                            orient="auto"
                          >
                            <polygon points="0 0, 10 3.5, 0 7" />
                          </marker>
                        </defs>
                      </svg>
                    )}
                    {element.type === "square" && (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "2px solid black",
                        }}
                      />
                    )}
                  </div>
                ))}
                {selectedTool === "text" && (
                  <div
                    style={{
                      position: "absolute",
                      left: cursorPosition.x,
                      top: cursorPosition.y,
                      pointerEvents: "none",
                    }}
                  >
                    <div className="p-1 rounded-md border border-gray-400">
                      Text goes here
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-[#b0b0b0] flex justify-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="w-80 p-4 overflow-y-auto bg-[#e0e0e0]">
          <div className="space-y-6">
            <div>
              <Label htmlFor="padding" className="text-xs font-medium">
                Padding
              </Label>
              <Slider
                id="padding"
                min={0}
                max={100}
                step={1}
                value={[padding]}
                onValueChange={([value]) => setPadding(value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="inset" className="text-xs font-medium">
                Inset
              </Label>
              <Slider
                id="inset"
                min={0}
                max={100}
                step={1}
                value={[inset]}
                onValueChange={([value]) => setInset(value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="rounded" className="text-xs font-medium">
                Rounded
              </Label>
              <Slider
                id="rounded"
                min={0}
                max={50}
                step={1}
                value={[rounded]}
                onValueChange={([value]) => setRounded(value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="shadow" className="text-xs font-medium">
                Shadow
              </Label>
              <Slider
                id="shadow"
                min={0}
                max={100}
                step={1}
                value={[shadow]}
                onValueChange={([value]) => setShadow(value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Background</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {backgroundColors.map((bg) => (
                  <Button
                    key={bg.name}
                    variant="outline"
                    className="w-full h-8 p-0"
                    style={{ backgroundColor: bg.color }}
                    onClick={() => setBackground(bg.color)}
                  >
                    <span className="sr-only">{bg.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Ratio / Size</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {["Auto", "4:3", "3:2", "16:9"].map((r) => (
                  <Button
                    key={r}
                    variant={ratio === r.toLowerCase() ? "default" : "outline"}
                    className="w-full text-xs"
                    onClick={() => setRatio(r.toLowerCase())}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            <Button onClick={handleSave} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Save Image
            </Button>
            <Button onClick={handleCopyToClipboard} className="w-full">
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </div>
  );
}
