import { useEffect, useRef, useState } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isAudioFile } from "@/lib/media";
import { newTapeId, putTape } from "@/lib/tape";
import { cn } from "@/lib/utils";

export type TapePick = {
  tapeId: string;
  name: string;
};

export function TapeBooth({
  value,
  onPick,
}: {
  value: TapePick | null;
  onPick: (tape: TapePick | null) => void;
}) {
  const [over, setOver] = useState(false);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const media = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function takeFiles(list: FileList | File[] | null) {
    const files = [...(list ?? [])].filter(isAudioFile);
    if (!files.length) {
      toast("Drop audio — mp3, m4a, wav, aac.");
      return;
    }
    const file = files[0];
    const id = newTapeId();
    await putTape(id, file, file.name);
    onPick({ tapeId: id, name: file.name });
    toast(`Tape queued · ${file.name}`);
  }

  async function toggleBooth() {
    if (rec) {
      media.current?.stop();
      return;
    }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mic;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(mic, { mimeType: mime });
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        mic.getTracks().forEach((t) => t.stop());
        stream.current = null;
        setRec(false);
        if (timer.current) window.clearInterval(timer.current);
        const blob = new Blob(chunks.current, { type: recorder.mimeType });
        if (blob.size < 1000) {
          toast("Booth was empty.");
          return;
        }
        const id = newTapeId();
        const name = `booth-${new Date().toISOString().slice(11, 19)}.webm`;
        await putTape(id, blob, name);
        onPick({ tapeId: id, name });
        toast("Booth stamped to the queue.");
      };
      media.current = recorder;
      recorder.start();
      setRec(true);
      setSecs(0);
      timer.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      toast("Mic blocked. Drop a file instead.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac,.webm"
        className="sr-only"
        onChange={(e) => {
          void takeFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void takeFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-6 text-center",
          over
            ? "border-gold bg-gold/10"
            : "border-border bg-obsidian",
        )}
      >
        <Upload className="size-5 text-gold" />
        <p className="mt-2 text-sm text-ivory">Drop the tape</p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-ash">
          mp3 · m4a · wav · booth
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            Upload
          </Button>
          <Button
            type="button"
            variant={rec ? "magenta" : "outline"}
            size="sm"
            onClick={() => void toggleBooth()}
          >
            {rec ? <Square className="size-3.5" /> : <Mic className="size-3.5" />}
            {rec ? `Stop · ${secs}s` : "Booth"}
          </Button>
        </div>
      </div>
      {value ? (
        <p className="text-xs uppercase tracking-[0.14em] text-gold">
          Queued · {value.name}
          <button
            type="button"
            className="ml-3 text-ash hover:text-ivory"
            onClick={() => onPick(null)}
          >
            Clear
          </button>
        </p>
      ) : (
        <p className="text-xs text-ash">
          Music and beats need a tape so the 1/1 plays.
        </p>
      )}
    </div>
  );
}
