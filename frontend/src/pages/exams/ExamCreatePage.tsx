import {
  CloseOutlined,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons'
import styled from '@emotion/styled'
import { yupResolver } from '@hookform/resolvers/yup'
import { Button, Flex, InputNumber, Radio, Space } from 'antd'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { DropDownFixedValues } from '../../components/common/DropDownFixedValues'
import { Input } from '../../components/common/input'
import { useToast } from '../../hooks/useToast'
import {
  useCreateExamMutation,
  useUpdateExamMutation,
} from '../../services/api/examApi'
import { Exam, ExamLevel, ExamLevelLabel, ExamRequest } from '../../types/exam'
import {
  PointsLabel,
  PointsSection,
  PublishStatusLabel,
  PublishStatusSection,
  RequiredStar,
} from '../question/QuestionCreatePage'
import { ExamQuestionList } from './ExamQuestionList'

const examSchema = yup.object({
  name: yup.string().required('Tên bài thi không được để trống'),
  level: yup
    .mixed<ExamLevel>()
    .oneOf(Object.values(ExamLevel), 'Cấp độ không hợp lệ')
    .required('Vui lòng nhập cấp độ bài thi'),
  score: yup
    .number()
    .typeError('Điểm phải là số')
    .min(0, 'Điểm phải lớn hơn hoặc bằng 0')
    .optional(),
  isPublic: yup.boolean().required('Vui lòng chọn trạng thái xuất bản'),
  questions: yup
    .array()
    .min(1, 'Phải có ít nhất 1 câu hỏi')
    .required('Phải có ít nhất 1 câu hỏi'),
  idsTag: yup.array().default([]),
})

interface ExamCreatePageProps {
  initData?: Exam
  isUpdate?: boolean
  onSuccess?: () => void
}

export const ExamCreatePage = (props?: ExamCreatePageProps) => {
  const { initData, isUpdate, onSuccess } = props || {}
  const toast = useToast()
  const [createExam, { isLoading: isCreateLoading }] = useCreateExamMutation()
  const [updateExam, { isLoading: isUpdateLoading }] = useUpdateExamMutation()
  const navigate = useNavigate()
  const isLoading = isUpdate ? isUpdateLoading : isCreateLoading

  console.log('initData', initData)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm<ExamRequest>({
    resolver: yupResolver(examSchema) as any,
    defaultValues:
      isUpdate && initData
        ? {
            name: initData.name,
            level: initData.level,
            questions: initData.examQuestion || [],
            idsTag: [],
            score: initData.score,
            isPublic: initData.isPublic,
          }
        : {
            name: '',
            level: ExamLevel.EASY,
            questions: [],
            idsTag: [],
            score: 0,
            isPublic: false,
          },
  })

  // Watch questions để tự động tính tổng điểm
  const questions = watch('questions')
  
  // Tự động tính tổng điểm từ các câu hỏi
  const totalScore = useMemo(() => {
    if (!questions || questions.length === 0) return 0
    return questions.reduce((sum, q) => sum + (q.point || 0), 0)
  }, [questions])

  // Cập nhật score khi totalScore thay đổi
  useEffect(() => {
    setValue('score', totalScore)
  }, [totalScore, setValue])

  // Reset form khi initData thay đổi (khi switch exam khác trong modal)
  useEffect(() => {
    if (isUpdate && initData) {
      reset({
        name: initData.name,
        level: initData.level,
        questions: initData.examQuestion || [],
        idsTag: [],
        score: initData.score,
        isPublic: initData.isPublic,
      })
    }
  }, [initData, isUpdate, reset])

  const submit = async (data: ExamRequest) => {
    try {
      if (isUpdate && initData) {
        const result = await updateExam({
          id: initData.id.toString(),
          request: data,
        }).unwrap()
        toast.success(
          'Cập nhật bài thi thành công!',
          `Bài thi "${result.name}" đã được cập nhật`
        )
        // Reset form với dữ liệu mới từ response
        reset({
          name: result.name,
          level: result.level,
          questions: result.examQuestion || [],
          idsTag: [],
          score: result.score,
          isPublic: result.isPublic,
        })
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/exams')
        }
      } else {
        const result = await createExam(data).unwrap()
        toast.success(
          'Tạo bài thi thành công!',
          `Bài thi "${result.name}" đã được tạo`
        )
        navigate('/exams')
      }
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      const title = isUpdate ? 'Lỗi cập nhật bài thi' : 'Lỗi tạo bài thi'
      toast.error(title, errorMessage)
    }
  }

  const handlePublish = handleSubmit(submit, (errors) => {
    // Callback khi có lỗi validation
    const firstError = Object.values(errors)[0]
    const errorMessage =
      firstError?.message || 'Vui lòng kiểm tra lại thông tin'
    toast.error('Lỗi validation', errorMessage)
  })

  const handleCancel = () => {
    if (isUpdate && onSuccess) {
      onSuccess() // Close modal
    } else {
      navigate('/exams')
    }
  }

  const handleSaveDraft = handleSubmit(
    async (data) => {
      // Logic lưu nháp
      console.log('Saving draft:', data)
      toast.success(
        'Lưu nháp thành công!',
        'Bài thi đã được lưu dưới dạng nháp'
      )
    },
    (errors) => {
      toast.error(
        'Lỗi validation',
        'Vui lòng nhập đầy đủ thông tin trước khi lưu nháp'
      )
    }
  )

  return (
    <Wrapper>
      <SectionCard>
        <HeaderStyled>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                title={'Tên'}
                {...field}
                require
                placeholder="Nhập tên bài thi"
                error={!!errors.name}
              />
            )}
          />
          <Controller
            name="level"
            control={control}
            render={({ field }) => (
              <DropDownFixedValues
                {...field}
                options={Object.entries(ExamLevel).map((value) => ({
                  value: value[0],
                  label: ExamLevelLabel[value[1]],
                }))}
                title="Chọn cấp độ"
                required
                placeholder="Chọn cấp độ bài thi"
                style={{ flex: 1 }}
              />
            )}
          />
        </HeaderStyled>
      </SectionCard>

      <Controller
        name="questions"
        control={control}
        render={({ field }) => (
          <ExamQuestionList
            questions={field.value ?? []}
            onChange={field.onChange}
          />
        )}
      />

      <PointsSection>
        <PointsLabel>
          Tổng điểm:
        </PointsLabel>
        <Controller
          name="score"
          control={control}
          render={({ field }) => (
            <div>
              <InputNumber
                {...field}
                value={totalScore}
                disabled
                placeholder="0"
                min={0}
                style={{ width: 200 }}
                status={errors.score ? 'error' : undefined}
              />
            </div>
          )}
        />
      </PointsSection>

      <PublishStatusSection>
        <PublishStatusLabel>
          Trạng thái xuất bản: <RequiredStar>*</RequiredStar>
        </PublishStatusLabel>
        <Controller
          name="isPublic"
          control={control}
          render={({ field }) => (
            <div>
              <Radio.Group
                value={field.value ? 'public' : 'private'}
                onChange={(e) => field.onChange(e.target.value === 'public')}
              >
                <Space direction="horizontal">
                  <Radio value="private">Chỉ mình tôi</Radio>
                  <Radio value="public">Công khai</Radio>
                </Space>
              </Radio.Group>
              {errors.isPublic && (
                <ErrorText>{errors.isPublic.message}</ErrorText>
              )}
            </div>
          )}
        />
      </PublishStatusSection>

      {/* Footer buttons */}
      <FooterBar>
        <Flex gap="small" justify="flex-end">
          <Button icon={<CloseOutlined />} onClick={handleCancel}>
            Huỷ
          </Button>
          <Button
            icon={<FileTextOutlined />}
            type="default"
            onClick={handleSaveDraft}
            loading={isLoading}
          >
            Lưu nháp
          </Button>
          <Button
            icon={<SendOutlined />}
            type="primary"
            onClick={handlePublish}
            loading={isLoading}
          >
            {isUpdate ? 'Cập nhật' : 'Xuất bản'}
          </Button>
        </Flex>
      </FooterBar>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: #f9fafb;
  min-height: 100vh;
`

const SectionCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`

const HeaderStyled = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;

  > * {
    flex: 1;
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const FooterBar = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
`

export const ErrorText = styled.div`
  color: #ff4d4f;
  font-size: 14px;
  margin-top: 4px;
`
