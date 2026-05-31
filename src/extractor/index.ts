import type ts from 'typescript'
import type { ComponentDoc, FileParser, ParserOptions, 
  Props, PropItem, PropItemType } 
from 'react-docgen-typescript'

export interface Component {
  name: string
}

export interface ParentType {
  name: string
  fileName: string
}

export type PropFilter = (prop: PropItem, component: Component) => boolean

export type ComponentNameResolver = (
  exp: ts.Symbol,
  source: ts.SourceFile
) => string | undefined | null | false

export interface StaticPropFilter {
  skipPropsWithName?: string | string[]
  skipPropsWithoutDoc?: boolean
}

export interface ComponentSchema {
  displayName: string
  description: string
  props: Props
  filePath: string
}

export type { ComponentDoc, FileParser, ParserOptions, Props, PropItem, PropItemType }
