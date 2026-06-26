import React, { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "react-email";

type MamaluVoucherEmailProps = {
  recipientName?: string;
  frontImageSrc?: string;
  termsImageSrc?: string;
};

export default function MamaluVoucherEmail({
  recipientName = "there",
  frontImageSrc = "cid:mamalu-voucher-front",
  termsImageSrc = "cid:mamalu-voucher-terms",
}: MamaluVoucherEmailProps): React.JSX.Element {
  return (
    <Html lang="en">
      <Head />
      <Preview>Your Mamalu Kitchen gift voucher</Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={greetingStyle}>Hi {recipientName},</Text>

          <Text style={messageStyle}>
            Your Mamalu Kitchen gift voucher is ready. The voucher code and
            issue date are already included in the designs below.
          </Text>

          <Section style={imageSectionStyle}>
            <Img
              src={frontImageSrc}
              alt="Mamalu Kitchen gift card"
              width="815"
              height="579"
              style={imageStyle}
            />
          </Section>

          <Section style={imageSectionStyle}>
            <Img
              src={termsImageSrc}
              alt="Mamalu Kitchen voucher terms and conditions"
              width="815"
              height="579"
              style={imageStyle}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: CSSProperties = {
  margin: "0",
  padding: "24px 12px",
  backgroundColor: "#f5f5f5",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "815px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
};

const greetingStyle: CSSProperties = {
  margin: "0 0 12px",
  color: "#111111",
  fontSize: "16px",
  lineHeight: "24px",
};

const messageStyle: CSSProperties = {
  margin: "0 0 20px",
  color: "#333333",
  fontSize: "15px",
  lineHeight: "23px",
};

const imageSectionStyle: CSSProperties = {
  margin: "0 0 18px",
};

const imageStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "815px",
  height: "auto",
  border: "0",
};
