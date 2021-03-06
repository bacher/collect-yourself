import React, {useCallback, useMemo, useState} from 'react';
import {useDropzone} from 'react-dropzone';

import styles from './App.module.scss';
import type {Point} from '../../types';
import {Editor} from '../Editor';
import {Combiner} from '../Combiner';
import {loadLinesFromStorage, saveLineToStorage} from '../../utils/storage';

export function App() {
  const [files, setFiles] = useState<
    {
      file: File;
      fileName: string;
      blob: Blob;
      blobUrl: string;
      line?: [Point, Point];
    }[]
  >([]);

  const [selectedImageIndex, setImageIndex] = useState<number>();

  const linesState = useMemo(() => loadLinesFromStorage(), []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const images = acceptedFiles
        .filter((file) => file.type?.startsWith('image/'))
        .map((file) => {
          const blob = new Blob([file]);

          return {
            file,
            fileName: file.name,
            blob,
            blobUrl: URL.createObjectURL(blob),
            line: linesState[file.name] || undefined,
          };
        });

      if (images.length) {
        // TODO: Remove
        // @ts-ignore
        window._image = images[0];

        setFiles([...files, ...images]);

        if (selectedImageIndex === undefined) {
          setImageIndex(0);
        }
      }
    },
    [files],
  );

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <div>
      <div className={styles.fileList}>
        {files.map(({fileName, blobUrl, line}, i) => (
          <button
            key={i}
            className={styles.file}
            type="button"
            data-active={i === selectedImageIndex || undefined}
            onClick={(e) => {
              e.preventDefault();
              setImageIndex(i);
            }}
          >
            <img src={blobUrl} alt={styles.fileName} className={styles.imgPreview} />
            <p className={styles.fileName}>{fileName}</p>
            {line ? <span className={styles.done}>&#10003;</span> : null}
          </button>
        ))}
        <div {...getRootProps()} className={styles.dropZone}>
          <input {...getInputProps()} />
          <span className={styles.addFile}>+</span>
        </div>
      </div>
      <div className={styles.main}>
        {selectedImageIndex !== undefined && (
          <Editor
            key={files[selectedImageIndex].blobUrl}
            url={files[selectedImageIndex].blobUrl}
            initialLine={files[selectedImageIndex].line}
            onLineDone={(line) => {
              setFiles(
                files.map((file, i) => {
                  if (i === selectedImageIndex) {
                    saveLineToStorage(file.fileName, line);

                    return {
                      ...file,
                      line,
                    };
                  }

                  return file;
                }),
              );
            }}
          />
        )}
        {files.length && files.every((f) => f.line) ? (
          <Combiner
            files={files.map(({file, line}) => ({
              file,
              line: line!,
            }))}
          />
        ) : null}
      </div>
    </div>
  );
}
