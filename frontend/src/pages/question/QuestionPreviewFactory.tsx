import { QuestionType } from "../../types/question";
import { MultiChoiceData } from "./MultiChoice";
import { OneChoiceData } from "./OneChoice";
import { MultiChoicePreview } from "./previews/MultiChoicePreview";
import { OneChoicePreview } from "./previews/OneChoicePreview";
import { TrueFalsePreview } from "./previews/TrueFalsePreview";
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
    default:
      return <div>Not implements</div>;
  }
};
