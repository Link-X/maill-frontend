import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Button, cn, extractErrorMessage, notify } from '@maill/shared';
import { useUploadImageMutation, type UploadDir } from '@/features/upload/uploadApi';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  /** MinIO 目录前缀，常用 posters / avatars / rooms，默认后端 misc */
  dir?: UploadDir;
  /** 最大允许文件大小（MB），默认 5 */
  maxSizeMB?: number;
  /** 接受的 MIME 类型，默认 image/* */
  accept?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  dir,
  maxSizeMB = 5,
  accept = 'image/*',
  className,
}: Props) {
  const [uploadImage, { isLoading }] = useUploadImageMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify.error('请选择图片文件');
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      notify.error(`图片大小不能超过 ${maxSizeMB}MB`);
      return;
    }
    try {
      const { url } = await uploadImage({ file, dir }).unwrap();
      onChange(url);
    } catch (e) {
      notify.error(extractErrorMessage(e));
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    // 清空 input，便于再次选同一文件
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const clear = () => onChange('');

  if (value) {
    return (
      <div className={cn('relative inline-block rounded-lg overflow-hidden border border-border/60', className)}>
        <img src={value} alt="" className="block w-32 h-32 object-cover" />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <Button type="button" size="sm" variant="outline" onClick={pickFile} disabled={isLoading}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            替换
          </Button>
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={isLoading}
          aria-label="移除图片"
          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />
      </div>
    );
  }

  return (
    <div
      onClick={pickFile}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'w-32 h-32 rounded-lg border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1 text-xs transition-colors',
        dragOver
          ? 'border-brand bg-brand/5 text-brand'
          : 'border-border/70 text-muted-foreground hover:border-brand/60 hover:text-brand',
        isLoading && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>上传中...</span>
        </>
      ) : (
        <>
          <ImagePlus className="h-5 w-5" />
          <span>点击或拖拽上传</span>
          <span className="text-[10px] text-muted-foreground/70">≤ {maxSizeMB}MB</span>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={onInputChange} />
    </div>
  );
}
