import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";

// Noto Sans Devanagari covers Latin + Devanagari.
Font.register({
  family: "Noto",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSansDevanagari-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/NotoSansDevanagari-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

// The traditional receipt is printed in a single red ink on white.
const RED = "#c53211";

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontFamily: "Noto",
    fontSize: 10,
    color: RED,
    backgroundColor: "#ffffff",
  },
  frame: {
    flex: 1,
    borderWidth: 2.4,
    borderColor: RED,
    borderRadius: 10,
    padding: 3,
  },
  inner: {
    flex: 1,
    borderWidth: 1,
    borderColor: RED,
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  corner: {
    position: "absolute",
    width: 9,
    height: 9,
    backgroundColor: RED,
    transform: "rotate(45deg)",
  },
  topBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  blessing: { fontSize: 9.5, fontWeight: 700 },
  regNo: { fontSize: 9.5, fontWeight: 700 },
  mainBand: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  emblem: { width: 66, height: 66, objectFit: "contain" },
  centerCol: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  orgName: { fontSize: 19, fontWeight: 700, textAlign: "center" },
  tagline1: { fontSize: 11.5, fontWeight: 700, textAlign: "center", marginTop: 1 },
  tagline2: { fontSize: 9, fontWeight: 700, textAlign: "center", marginTop: 1 },
  yearBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.4,
    borderColor: RED,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  yearBadgeText: { fontSize: 10, fontWeight: 700 },
  address: { fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 3 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  metaLabel: { fontSize: 10.5, fontWeight: 700 },
  metaValue: {
    fontSize: 11,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: RED,
    minWidth: 90,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 9,
  },
  fieldLabel: { fontSize: 11.5, fontWeight: 700 },
  fieldValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: RED,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  thanksLine: { fontSize: 11.5, fontWeight: 700, marginTop: 10 },
  dhanyavad: { fontSize: 14, fontWeight: 700, textAlign: "center", marginTop: 2 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: RED,
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  amountRu: { fontSize: 12, fontWeight: 700, marginRight: 8 },
  amountValue: { fontSize: 13, fontWeight: 700 },
  signLabel: { fontSize: 10, fontWeight: 700 },
});

export type ReceiptPdfData = {
  org: {
    /** Marathi-first display name. */
    name: string;
    /** Marathi address line, e.g. "मु. …, ता. …, जि. …". */
    address: string;
    registrationNumber?: string | null;
    blessing?: string | null;
    tagline1?: string | null;
    tagline2?: string | null;
    logoDataUri?: string | null;
    deityDataUri?: string | null;
  };
  receiptNumber: string;
  /** dd/mm/yyyy */
  receiptDate: string;
  memberName: string;
  modeName: string;
  yearLabels: string[];
  /** "एक हजार दोनशे रुपये फक्त" */
  amountWords: string;
  total: string;
};

function fmtAmount(amount: string) {
  const n = Number(amount);
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** "Cash" prints as रोख; other modes print their own name. */
function receivedLine(modeName: string): string {
  const mode = modeName.trim().toLowerCase() === "cash" ? "रोख" : modeName;
  return `${mode} मिळाले. सहकार्याबद्दल कार्यकारी मंडळ आभारी आहोत !`;
}

export async function renderReceiptPdf(d: ReceiptPdfData): Promise<Buffer> {
  const corners = [
    { top: -3, left: -3 },
    { top: -3, right: -3 },
    { bottom: -3, left: -3 },
    { bottom: -3, right: -3 },
  ];
  const doc = (
    <Document>
      <Page size={[595, 312]} style={styles.page}>
        <View style={styles.frame}>
          {corners.map((pos, i) => (
            <View key={i} style={[styles.corner, pos]} />
          ))}
          <View style={styles.inner}>
            {/* blessing + registration number */}
            <View style={styles.topBand}>
              <Text style={{ width: 70 }} />
              <Text style={styles.blessing}>{d.org.blessing ?? " "}</Text>
              <Text style={styles.regNo}>
                {d.org.registrationNumber
                  ? `रजि. नं. ${d.org.registrationNumber}`
                  : " "}
              </Text>
            </View>

            {/* emblems + titles */}
            <View style={styles.mainBand}>
              {d.org.logoDataUri ? (
                <Image style={styles.emblem} src={d.org.logoDataUri} />
              ) : (
                <View style={styles.emblem} />
              )}
              <View style={styles.centerCol}>
                <Text style={styles.orgName}>{d.org.name}</Text>
                {d.org.tagline1 ? (
                  <Text style={styles.tagline1}>{d.org.tagline1}</Text>
                ) : null}
                {d.org.tagline2 ? (
                  <Text style={styles.tagline2}>{d.org.tagline2}</Text>
                ) : null}
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>
                    सभासद वर्गणी वर्षे  {d.yearLabels.join(", ")}
                  </Text>
                </View>
                <Text style={styles.address}>{d.org.address}</Text>
              </View>
              {d.org.deityDataUri ? (
                <Image style={styles.emblem} src={d.org.deityDataUri} />
              ) : (
                <View style={styles.emblem} />
              )}
            </View>

            {/* receipt no + date */}
            <View style={styles.metaRow}>
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={styles.metaLabel}>पावती क्र.: </Text>
                <Text style={styles.metaValue}>{d.receiptNumber}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
                <Text style={styles.metaLabel}>दि.: </Text>
                <Text style={styles.metaValue}>{d.receiptDate}</Text>
              </View>
            </View>

            {/* member + amount in words */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>श्री./श्रीमती </Text>
              <Text style={styles.fieldValue}>{d.memberName}</Text>
              <Text style={styles.fieldLabel}> यांसकडून</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>देणगी (अक्षरी) रु. </Text>
              <Text style={styles.fieldValue}>{d.amountWords}</Text>
            </View>

            <Text style={styles.thanksLine}>{receivedLine(d.modeName)}</Text>
            <Text style={styles.dhanyavad}>धन्यवाद !</Text>

            {/* amount box + signatures */}
            <View style={styles.bottomRow}>
              <View style={styles.amountBox}>
                <Text style={styles.amountRu}>रु.</Text>
                <Text style={styles.amountValue}>{fmtAmount(d.total)}/-</Text>
              </View>
              <Text style={styles.signLabel}>अध्यक्ष</Text>
              <Text style={styles.signLabel}>उपाध्यक्ष</Text>
              <Text style={styles.signLabel}>सेक्रेटरी</Text>
              <Text style={styles.signLabel}>खजिनदार</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
  return renderToBuffer(doc);
}
