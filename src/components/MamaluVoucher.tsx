import React, {
  CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";

type GeneratedVoucher = {
  front: Blob;
  terms: Blob;
};

type MamaluVoucherProps = {
  voucherCode: string;
  issueDate: string;
  toName?: string;
  fromName?: string;
  frontTemplateUrl?: string;
  termsTemplateUrl?: string;
  onGenerated?: (voucher: GeneratedVoucher) => void;
};

const TEMPLATE_WIDTH = 815;
const TEMPLATE_HEIGHT = 579;
const FONT_FAMILY = '"Coming Soon", cursive';

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    image.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Unable to generate voucher image."));
    }, "image/png");
  });

const drawFittedText = (
  context: CanvasRenderingContext2D,
  text: string,
  options: {
    centerX: number;
    baselineY: number;
    maxWidth: number;
    fontSize: number;
    minimumFontSize?: number;
  },
): void => {
  const value = text.trim();

  if (!value) {
    return;
  }

  const minimumFontSize = options.minimumFontSize ?? 16;
  let currentFontSize = options.fontSize;

  context.textAlign = "center";
  context.textBaseline = "alphabetic";

  do {
    context.font = `${currentFontSize}px ${FONT_FAMILY}`;

    if (context.measureText(value).width <= options.maxWidth) {
      break;
    }

    currentFontSize -= 1;
  } while (currentFontSize > minimumFontSize);

  /*
   * The white stroke prevents the printed blank line from showing through
   * the dynamic text while preserving the original voucher artwork.
   */
  context.lineJoin = "round";
  context.lineWidth = 5;
  context.strokeStyle = "#ffffff";
  context.fillStyle = "#111111";
  context.strokeText(value, options.centerX, options.baselineY);
  context.fillText(value, options.centerX, options.baselineY);
};

const renderFrontVoucher = async (
  canvas: HTMLCanvasElement,
  templateUrl: string,
  values: Pick<MamaluVoucherProps, "voucherCode" | "toName" | "fromName">,
): Promise<void> => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported by this browser.");
  }

  const template = await loadImage(templateUrl);

  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;

  context.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  context.drawImage(template, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

  drawFittedText(context, values.toName ?? "", {
    centerX: 407,
    baselineY: 229,
    maxWidth: 132,
    fontSize: 21,
  });

  drawFittedText(context, values.fromName ?? "", {
    centerX: 407,
    baselineY: 251,
    maxWidth: 132,
    fontSize: 21,
  });

  // The voucher code is written directly on the Message line.
  drawFittedText(context, values.voucherCode, {
    centerX: 505,
    baselineY: 337,
    maxWidth: 365,
    fontSize: 30,
    minimumFontSize: 20,
  });
};

const renderTermsVoucher = async (
  canvas: HTMLCanvasElement,
  templateUrl: string,
  values: Pick<MamaluVoucherProps, "voucherCode" | "issueDate">,
): Promise<void> => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not supported by this browser.");
  }

  const template = await loadImage(templateUrl);

  canvas.width = TEMPLATE_WIDTH;
  canvas.height = TEMPLATE_HEIGHT;

  context.clearRect(0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  context.drawImage(template, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

  drawFittedText(context, values.issueDate, {
    centerX: 501,
    baselineY: 377,
    maxWidth: 190,
    fontSize: 23,
    minimumFontSize: 17,
  });

  /*
   * Replace the sample "018" at the bottom with the actual voucher code.
   * This keeps both pages consistent.
   */
  context.fillStyle = "#ffffff";
  context.fillRect(374, 524, 82, 39);

  drawFittedText(context, values.voucherCode, {
    centerX: 415,
    baselineY: 554,
    maxWidth: 72,
    fontSize: 24,
    minimumFontSize: 16,
  });
};

export default function MamaluVoucher({
  voucherCode,
  issueDate,
  toName = "",
  fromName = "",
  frontTemplateUrl = "/voucher/page-1.png",
  termsTemplateUrl = "/voucher/page-2.png",
  onGenerated,
}: MamaluVoucherProps): React.JSX.Element {
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const termsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const renderVoucher = async (): Promise<void> => {
      const frontCanvas = frontCanvasRef.current;
      const termsCanvas = termsCanvasRef.current;

      if (!frontCanvas || !termsCanvas) {
        return;
      }

      try {
        setError("");

        /*
         * Put ComingSoon-Regular.ttf in /public/fonts.
         * The PDF uses Coming Soon Regular for its handwritten text.
         */
        await document.fonts.load(`30px ${FONT_FAMILY}`);

        await Promise.all([
          renderFrontVoucher(frontCanvas, frontTemplateUrl, {
            voucherCode,
            toName,
            fromName,
          }),
          renderTermsVoucher(termsCanvas, termsTemplateUrl, {
            voucherCode,
            issueDate,
          }),
        ]);

        const [front, terms] = await Promise.all([
          canvasToBlob(frontCanvas),
          canvasToBlob(termsCanvas),
        ]);

        if (!cancelled) {
          onGenerated?.({ front, terms });
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render the voucher.",
          );
        }
      }
    };

    void renderVoucher();

    return () => {
      cancelled = true;
    };
  }, [
    frontTemplateUrl,
    fromName,
    issueDate,
    onGenerated,
    termsTemplateUrl,
    toName,
    voucherCode,
  ]);

  const downloadCanvas = (
    canvas: HTMLCanvasElement | null,
    filename: string,
  ): void => {
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const wrapperStyle: CSSProperties = {
    width: "100%",
    maxWidth: "815px",
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  };

  const canvasStyle: CSSProperties = {
    display: "block",
    width: "100%",
    height: "auto",
    marginBottom: "20px",
  };

  const buttonStyle: CSSProperties = {
    border: "0",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    background: "#111111",
    color: "#ffffff",
    fontSize: "14px",
  };

  return (
    <div style={wrapperStyle}>
      <style>
        {`
          @font-face {
            font-family: "Coming Soon";
            src: url("/fonts/ComingSoon-Regular.ttf") format("truetype");
            font-style: normal;
            font-weight: 400;
            font-display: swap;
          }
        `}
      </style>

      {error ? (
        <p style={{ color: "#b00020", marginBottom: "16px" }}>{error}</p>
      ) : null}

      <canvas
        ref={frontCanvasRef}
        width={TEMPLATE_WIDTH}
        height={TEMPLATE_HEIGHT}
        style={canvasStyle}
      />

      <canvas
        ref={termsCanvasRef}
        width={TEMPLATE_WIDTH}
        height={TEMPLATE_HEIGHT}
        style={canvasStyle}
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            downloadCanvas(frontCanvasRef.current, `${voucherCode}-front.png`)
          }
        >
          Download front
        </button>

        <button
          type="button"
          style={buttonStyle}
          onClick={() =>
            downloadCanvas(termsCanvasRef.current, `${voucherCode}-terms.png`)
          }
        >
          Download terms
        </button>
      </div>
    </div>
  );
}
