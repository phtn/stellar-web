export function secureId() {
  return crypto.randomUUID()
}

type BSTNode<T> = {
  value: T
  left: BST<T>
  right: BST<T>
}

type BST<T> = BSTNode<T> | null

const insert = <T>(tree: BST<T>, value: T): BST<T> => {
  if (!tree) return { value, left: null, right: null }
  if (value < tree.value) {
    return { ...tree, left: insert(tree.left, value) }
  } else {
    return { ...tree, right: insert(tree.right, value) }
  }
}

const search = <T>(tree: BST<T>, value: T): boolean => {
  if (!tree) return false
  if (value === tree.value) return true
  return value < tree.value
    ? search(tree.left, value)
    : search(tree.right, value)
}

const inOrderTraverse = <T>(
  tree: BST<T>,
  callback: (value: T) => void
): void => {
  if (!tree) return
  inOrderTraverse(tree.left, callback)
  callback(tree.value)
  inOrderTraverse(tree.right, callback)
}

// Example usage:
const tree = insert(null, 10)
const tree2 = insert(tree, 5)
const tree3 = insert(tree2, 15)

console.log(search(tree3, 5)) // true
console.log(search(tree3, 20)) // false

inOrderTraverse(tree3, value => console.log(value)) // 5, 10, 15
