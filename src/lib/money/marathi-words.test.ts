import { describe, expect, it } from "vitest";
import { amountInMarathiWords, numberToMarathiWords } from "./marathi-words";

describe("numberToMarathiWords", () => {
  it("handles 0–99 specials", () => {
    expect(numberToMarathiWords(0)).toBe("शून्य");
    expect(numberToMarathiWords(7)).toBe("सात");
    expect(numberToMarathiWords(19)).toBe("एकोणीस");
    expect(numberToMarathiWords(55)).toBe("पंचावन्न");
    expect(numberToMarathiWords(99)).toBe("नव्व्याण्णव");
  });

  it("handles hundreds", () => {
    expect(numberToMarathiWords(100)).toBe("शंभर");
    expect(numberToMarathiWords(101)).toBe("एकशे एक");
    expect(numberToMarathiWords(200)).toBe("दोनशे");
    expect(numberToMarathiWords(550)).toBe("पाचशे पन्नास");
  });

  it("handles thousands / lakhs / crores (Indian grouping)", () => {
    expect(numberToMarathiWords(1000)).toBe("एक हजार");
    expect(numberToMarathiWords(1200)).toBe("एक हजार दोनशे");
    expect(numberToMarathiWords(25000)).toBe("पंचवीस हजार");
    expect(numberToMarathiWords(100000)).toBe("एक लाख");
    expect(numberToMarathiWords(141615)).toBe("एक लाख एक्केचाळीस हजार सहाशे पंधरा");
    expect(numberToMarathiWords(10000000)).toBe("एक कोटी");
  });
});

describe("amountInMarathiWords", () => {
  it("formats the receipt phrase", () => {
    expect(amountInMarathiWords("1200")).toBe("एक हजार दोनशे रुपये फक्त");
    expect(amountInMarathiWords("500.00")).toBe("पाचशे रुपये फक्त");
    expect(amountInMarathiWords(1200.5)).toBe(
      "एक हजार दोनशे रुपये पन्नास पैसे फक्त",
    );
  });
});
