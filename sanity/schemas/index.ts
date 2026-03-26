import { post } from './documents/post'
import { postCategory } from './documents/postCategory'
import { project } from './documents/project'
import { projectCategory } from './documents/projectCategory'
import { showcaseEntry } from './documents/showcaseEntry'
import { codeBlock } from './objects/codeBlock'
import { codeSandbox } from './objects/codeSandbox'
import { gridGallery } from './objects/gridGallery'
import { quoteWithAuthor } from './objects/quoteWithAuthor'
import { showcaseItem } from './objects/showcaseItem'
import { sideNote } from './objects/sideNote'
import { socialNetwork } from './objects/socialNetwork'
import { tweetEmbed } from './objects/tweetEmbed'

export const schemaTypes = [
  // Document types
  post,
  postCategory,
  project,
  projectCategory,
  showcaseEntry,

  // Object types
  codeBlock,
  codeSandbox,
  gridGallery,
  quoteWithAuthor,
  showcaseItem,
  sideNote,
  socialNetwork,
  tweetEmbed,
]
