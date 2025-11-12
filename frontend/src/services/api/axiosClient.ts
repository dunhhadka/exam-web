import axios from 'axios'
import { BASE_URL } from '../../store/slices/baseQueries'

const examApiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})
