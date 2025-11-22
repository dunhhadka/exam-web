import { QuestionType } from "../../types/question";
import { EssayData } from "./Essay";
import { MultiChoiceData } from "./MultiChoice";
import { OneChoiceData } from "./OneChoice";
import { PlainTextData } from "./PlainText";
import { EssayPreview } from "./previews/EssayPreview";
import { MultiChoicePreview } from "./previews/MultiChoicePreview";
import { OneChoicePreview } from "./previews/OneChoicePreview";
import { PlainTextPreview } from "./previews/PlainTextPreview";
import { TableChoicePreview } from "./previews/TableChoicePreview";
import { TrueFalsePreview } from "./previews/TrueFalsePreview";
import { TableChoiceData } from "./TableChoice";
import { TrueFalseData } from "./TrueFalse";

interface Props {
  text: string;
  type: QuestionType;
  data: any; // Replace 'any' with the actual data type if available
}

export const QuestionPreviewFactory = ({ type, data, text }: Props) => {
  switch (type) {
    case QuestionType.TRUE_FALSE:
      return <TrueFalsePreview data={data as TrueFalseData} text={text} />;
    case QuestionType.ONE_CHOICE:
      return <OneChoicePreview data={data as OneChoiceData} text={text} />;
    case QuestionType.MULTI_CHOICE:
      return <MultiChoicePreview data={data as MultiChoiceData} text={text} />;
    case QuestionType.TABLE_CHOICE:
      return <TableChoicePreview data={data as TableChoiceData} text={text} point={0} />;
    case QuestionType.ESSAY:
      return <EssayPreview data={data as EssayData} />;
    case QuestionType.PLAIN_TEXT:
      return <PlainTextPreview data={data as PlainTextData} />;
    default:
      return <div>Not implements</div>;
  }
};
