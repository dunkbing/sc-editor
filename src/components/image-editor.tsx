import { useState, useRef, useCallback, useEffect } from "react";
import { toPng, toBlob } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Text,
  Square,
  ArrowRight,
  Upload,
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
} from "lucide-react";

export default function ImageEditor() {
  const [image, setImage] = useState<string | null>(null);
  const [padding, setPadding] = useState(39);
  const [inset, setInset] = useState(0);
  const [rounded, setRounded] = useState(16);
  const [shadow, setShadow] = useState(27);
  const [background, setBackground] = useState("#1e1e1e");
  const [ratio, setRatio] = useState("auto");
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editedImageRef = useRef<HTMLDivElement>(null);

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

  const backgroundColors = [
    { name: "Dark", color: "#1e1e1e" },
    { name: "Light", color: "#f0f0f0" },
    { name: "Blue", color: "#3b82f6" },
    { name: "Green", color: "#22c55e" },
    { name: "Purple", color: "#a855f7" },
  ];

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.1));

  const handleSave = async () => {
    if (!editedImageRef.current) {
      return;
    }
    const dataUrl = await toPng(editedImageRef.current);
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = dataUrl;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!editedImageRef.current) {
      return;
    }
    const blob = await toBlob(editedImageRef.current);
    if (blob) {
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    }
  };

  return (
    <div className="flex max-h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <ToggleGroup type="multiple" className="justify-start">
            <ToggleGroupItem value="text" aria-label="Insert text">
              <Text className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="arrow" aria-label="Add arrow">
              <ArrowRight className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="rectangle" aria-label="Draw rectangle">
              <Square className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
          <div
            ref={containerRef}
            className="relative overflow-auto"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <div
              ref={editedImageRef}
              className="inline-block origin-top-left transition-transform"
              style={{
                padding: `${padding}px`,
                backgroundColor: background,
                transform: `scale(${zoom})`,
              }}
            >
              {image ? (
                <img
                  ref={imageRef}
                  src={image}
                  alt="Uploaded"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    borderRadius: `${rounded}px`,
                    boxShadow: `0 0 ${shadow}px rgba(0,0,0,0.5)`,
                  }}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Image
                  </Button>
                  <p className="mt-2 text-sm text-gray-400">
                    or paste from clipboard
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 flex justify-center">
          <Button onClick={handleZoomOut} className="mr-2">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="w-80 border-l border-gray-800 p-4 overflow-y-auto">
        <Tabs defaultValue="edit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-4">
            <div>
              <Label htmlFor="padding">Padding</Label>
              <Slider
                id="padding"
                min={0}
                max={100}
                step={1}
                value={[padding]}
                onValueChange={([value]) => setPadding(value)}
              />
            </div>
            <div>
              <Label htmlFor="inset">Inset</Label>
              <Slider
                id="inset"
                min={0}
                max={100}
                step={1}
                value={[inset]}
                onValueChange={([value]) => setInset(value)}
              />
            </div>
            <div>
              <Label htmlFor="rounded">Rounded</Label>
              <Slider
                id="rounded"
                min={0}
                max={50}
                step={1}
                value={[rounded]}
                onValueChange={([value]) => setRounded(value)}
              />
            </div>
            <div>
              <Label htmlFor="shadow">Shadow</Label>
              <Slider
                id="shadow"
                min={0}
                max={100}
                step={1}
                value={[shadow]}
                onValueChange={([value]) => setShadow(value)}
              />
            </div>
            <div>
              <Label>Background</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {backgroundColors.map((bg) => (
                  <Button
                    key={bg.name}
                    variant={background === bg.color ? "default" : "outline"}
                    className="w-full h-8"
                    style={{ backgroundColor: bg.color }}
                    onClick={() => setBackground(bg.color)}
                  >
                    <span className="sr-only">{bg.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Ratio / Size</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {["Auto", "4:3", "3:2", "16:9"].map((r) => (
                  <Button
                    key={r}
                    variant={ratio === r.toLowerCase() ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setRatio(r.toLowerCase())}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="export" className="space-y-4">
            <Button onClick={handleSave} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Save Image
            </Button>
            <Button onClick={handleCopyToClipboard} className="w-full">
              <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
            </Button>
          </TabsContent>
        </Tabs>
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
