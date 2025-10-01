import { QuestionType } from '../../types/question'
import { MultiChoice } from './MultiChoice'
import { OneChoice } from './OneChoice'
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
    case QuestionType.ONE_CHOICE:
      return <OneChoice questionData={questionData} onChange={onChange} />
    case QuestionType.MULTI_CHOICE:
      return <MultiChoice questionData={questionData} onChange={onChange} />
    default:
      return <div>Not implements</div>
  }
}
