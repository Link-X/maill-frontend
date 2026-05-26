import { useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { extractErrorMessage, notify } from '@maill/shared';
import { useUploadImageMutation } from '@/api/uploadApi';

interface Props {
  /** 已上传图片 URL 列表 */
  value: string[];
  /** 列表变更回调 */
  onChange: (urls: string[]) => void;
  /** 最大可上传数量，默认 9 */
  max?: number;
  /** 存储目录，目前仅支持 reviews */
  dir?: 'reviews';
}

/**
 * 多图上传组件：用于评价晒图。
 * - 单文件 ≤ 5MB
 * - 仅接受 image/* 类型
 * - 依次串行上传，遇错单张提示但不中断其他图
 */
export function ImageUploader({ value, onChange, max = 9, dir = 'reviews' }: Props) {
  const [uploadImage] = useUploadImageMutation();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // 重置 input，确保下次选同名文件也能触发 change
    e.target.value = '';
    if (files.length === 0) return;

    const remaining = max - value.length;
    if (remaining <= 0) {
      notify.error(`最多 ${max} 张`);
      return;
    }

    setUploading(true);
    const next = [...value];
    for (const file of files.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        notify.error('仅支持图片');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        notify.error(`${file.name} 超过 5MB`);
        continue;
      }
      try {
        const res = await uploadImage({ file, dir }).unwrap();
        next.push(res.url);
      } catch (err) {
        notify.error(extractErrorMessage(err));
      }
    }
    onChange(next);
    setUploading(false);
  };

  const remove = (i: number) => {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {value.map((url, i) => (
        <div key={`${url}-${i}`} className="relative w-20 h-20 rounded-md overflow-hidden border">
          <img src={url} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-0 right-0 h-5 w-5 rounded-bl bg-black/60 text-white flex items-center justify-center"
            aria-label="remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {value.length < max && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          <span className="text-[11px] mt-1">
            {value.length}/{max}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handlePick}
          />
        </button>
      )}
    </div>
  );
}
