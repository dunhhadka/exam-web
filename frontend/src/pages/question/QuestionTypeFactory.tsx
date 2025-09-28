import { QuestionType } from '../../types/question'
import { TrueFalse } from './TrueFalse'

interface BaseQuestionProps<T = any> {
  questionType: QuestionType
  questionData?: T
  onChange: (data: T) => void
  isPreview?: boolean
}

export const QuestionFactory = ({
  questionType,
  questionData,
  onChange,
}: BaseQuestionProps) => {
  switch (questionType) {
    case QuestionType.TRUE_FALSE:
      return <TrueFalse questionData={questionData} onChange={onChange} />
    default:
      return <div>Not implements</div>
  }
}
