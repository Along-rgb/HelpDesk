'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Camera, MapPin, RefreshCw } from 'lucide-react';

export type WorkCompletionStatus =
  | 'ສໍາເລັດຄົບຖ້ວນ'
  | 'ສໍາເລັດແລ້ວລໍຖ້າກວດສອບ'
  | 'ສໍາເລັດບາງສ່ວນ';

export interface ReportWorkSaveData {
  workDetail: string;
  completedDate: Date | null;
  workCompletionStatus: WorkCompletionStatus;
  imageFile: File | null;
  latitude: number | null;
  longitude: number | null;
  captured_at: string | null;
}

export interface ReportWorkModalProps {
  visible: boolean;
  onHide: () => void;
  onSave: (data: ReportWorkSaveData) => Promise<void> | void;
  ticketId?: string | number | null;
  ticketTitle?: string | null;
}

function getCanUseCamera(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

function getCanUseGeo(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((t) => t.stop());
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!getCanUseGeo()) {
      reject(new Error('GEO_NOT_SUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('BLOB_FAILED'))), type, quality);
  });
}

export function ReportWorkModal({ visible, onHide, onSave, ticketId, ticketTitle }: ReportWorkModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [workDetail, setWorkDetail] = useState('');
  const completedDate: Date | null = null;
  const workCompletionStatus: WorkCompletionStatus = 'ສໍາເລັດຄົບຖ້ວນ';

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [capturedAt, setCapturedAt] = useState<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [loadingCapture, setLoadingCapture] = useState(false);
  const [saving, setSaving] = useState(false);

  const cleanupPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const closeAndCleanup = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setCameraReady(false);
    setLoadingCamera(false);
    setLoadingCapture(false);
    setSaving(false);
    cleanupPreview();
    onHide();
  }, [cleanupPreview, onHide]);

  const startCamera = useCallback(async () => {
    if (!getCanUseCamera()) {
      window.alert('ບໍ່ຮອງຮັບການໃຊ້ກ້ອງໃນ Browser ນີ້');
      return;
    }
    setLoadingCamera(true);
    setCameraReady(false);
    try {
      stopStream(streamRef.current);
      streamRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
      }
    } catch {
      window.alert('ບໍ່ສາມາດເປີດກ້ອງໄດ້ ກະລຸນາອະນຸຍາດການໃຊ້ກ້ອງ');
    } finally {
      setLoadingCamera(false);
    }
  }, []);

  const resetCaptureState = useCallback(() => {
    setImageFile(null);
    cleanupPreview();
    setLatitude(null);
    setLongitude(null);
    setCapturedAt(null);
  }, [cleanupPreview]);

  const retake = useCallback(async () => {
    resetCaptureState();
    await startCamera();
  }, [resetCaptureState, startCamera]);

  const capture = useCallback(async () => {
    if (!cameraReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!getCanUseGeo()) {
      window.alert('ບໍ່ຮອງຮັບການດຶງພິກັດ GPS ໃນ Browser ນີ້');
      return;
    }

    setLoadingCapture(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('CTX_FAILED');
      ctx.drawImage(video, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      const iso = new Date().toISOString();
      const file = new File([blob], `report_${iso.replace(/[:.]/g, '-')}.jpg`, { type: 'image/jpeg' });
      setCapturedAt(iso);
      setImageFile(file);
      cleanupPreview();
      setPreviewUrl(URL.createObjectURL(file));

      stopStream(streamRef.current);
      streamRef.current = null;
      setCameraReady(false);
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'code' in (e as { code?: number }) && (e as { code?: number }).code === 1
          ? 'ບໍ່ໄດ້ອະນຸຍາດໃຫ້ໃຊ້ GPS'
          : 'ບໍ່ສາມາດຖ່າຍຮູບ/ດຶງ GPS ໄດ້ ກະລຸນາລອງໃໝ່';
      window.alert(msg);
    } finally {
      setLoadingCapture(false);
    }
  }, [cameraReady, cleanupPreview]);

  const canSave = useMemo(() => {
    return workDetail.trim().length > 0 && imageFile != null && !saving;
  }, [workDetail, imageFile, saving]);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        workDetail,
        completedDate,
        workCompletionStatus,
        imageFile,
        latitude,
        longitude,
        captured_at: capturedAt,
      });
      closeAndCleanup();
    } catch (err) {
      const ax = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const msg =
        ax?.response?.data?.message ??
        ax?.response?.data?.error ??
        (typeof ax?.message === 'string' ? ax.message : null) ??
        'ບັນທຶກບໍ່ສຳເລັດ';
      window.alert(msg);
    } finally {
      setSaving(false);
    }
  }, [
    canSave,
    onSave,
    workDetail,
    completedDate,
    workCompletionStatus,
    imageFile,
    latitude,
    longitude,
    capturedAt,
    closeAndCleanup,
  ]);

  useEffect(() => {
    if (!visible) {
      stopStream(streamRef.current);
      streamRef.current = null;
      setCameraReady(false);
      cleanupPreview();
      return;
    }
    resetCaptureState();
    startCamera();
  }, [visible]);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const footer = (
    <div className="flex justify-content-end gap-2">
      <Button
        label="ຍົກເລີກ"
        className="p-button-outlined"
        onClick={closeAndCleanup}
        disabled={saving || loadingCapture}
      />
      <Button
        label={saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
        icon="pi pi-check"
        onClick={handleSave}
        disabled={!canSave}
      />
    </div>
  );

  return (
    <Dialog
      header={
        <div className="flex align-items-center gap-2" style={{ maxWidth: '75vw' }}>
          <span className="font-semibold">ລາຍງານວຽກ</span>
          {ticketId != null && String(ticketId).trim() !== '' ? (
            <span className="text-600 font-semibold">#{ticketId}</span>
          ) : null}
          {ticketTitle != null && ticketTitle.trim() !== '' ? (
            <span
              className="text-700 font-semibold"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={ticketTitle}
            >
              {ticketTitle}
            </span>
          ) : null}
        </div>
      }
      visible={visible}
      style={{ width: 'min(900px, 95vw)' }}
      modal
      onHide={closeAndCleanup}
      footer={footer}
      dismissableMask={!saving && !loadingCapture}
      closable={!saving && !loadingCapture}
    >
      <div className="flex flex-column gap-3">
        <div className="flex flex-column gap-2">
          <label className="font-semibold">ລາຍລະອຽດວຽກ</label>
          <InputTextarea
            value={workDetail}
            onChange={(e) => setWorkDetail(e.target.value)}
            rows={4}
            placeholder="ພິມລາຍລະອຽດ..."
          />
        </div>

        <div className="border-1 surface-border border-round p-3">
          <div className="flex justify-content-between align-items-center mb-3">
            <div className="flex align-items-center gap-2 font-semibold">
              <Camera size={18} />
              <span>ຖ່າຍຮູບ (Real-time)</span>
            </div>
            {imageFile ? (
              <Button
                type="button"
                label="ຖ່າຍໃໝ່"
                icon={<RefreshCw size={16} />}
                onClick={retake}
                className="p-button-outlined"
                disabled={saving || loadingCapture}
              />
            ) : null}
          </div>

          {!imageFile ? (
            <div className="flex flex-column gap-2">
              {!getCanUseCamera() ? (
                <div className="p-3 border-round surface-100 text-700">
                  ບໍ່ຮອງຮັບການໃຊ້ກ້ອງໃນ Browser ນີ້
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full border-round"
                    style={{ maxHeight: 360, background: '#000' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      label={loadingCamera ? 'ກຳລັງເປີດກ້ອງ...' : 'ເປີດກ້ອງ'}
                      icon={<Camera size={16} />}
                      onClick={startCamera}
                      className="p-button-outlined"
                      disabled={saving || loadingCapture || loadingCamera}
                    />
                    <Button
                      type="button"
                      label={loadingCapture ? 'ກຳລັງປະມວນຜົນ...' : 'ຖ່າຍຮູບ'}
                      icon="pi pi-camera"
                      onClick={capture}
                      disabled={saving || loadingCamera || loadingCapture || !cameraReady}
                    />
                  </div>
                  <div className="text-600 text-sm">
                    ເມື່ອກົດ "ຖ່າຍຮູບ" ລະບົບຈະດຶງພິກັດ GPS ທັນທີ
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-column gap-2">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full border-round"
                  style={{ maxHeight: 360, objectFit: 'contain' }}
                />
              ) : null}
              <div className="flex align-items-center gap-2 text-700">
                <MapPin size={18} />
                <span>
                  {latitude != null && longitude != null
                    ? `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                    : 'GPS: -'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
