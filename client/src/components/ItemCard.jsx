import Icon from './Icon.jsx';
import Thumb from './Thumb.jsx';
import { useStore } from '../store.jsx';
import { rs } from '../config.js';

export default function ItemCard({ item }) {
  const { add } = useStore();
  return (
    <article className="card">
      {item.badge && <span className="badge">{item.badge}</span>}
      <div className="card-text">
        <h3>{item.name}</h3>
        {item.desc && <p>{item.desc}</p>}
        <span className="price">{rs(item.price)}</span>
      </div>
      <div className="card-img">
        <Thumb item={item} />
        <button className="add" onClick={() => add(item)} aria-label={`Add ${item.name} to cart`}>
          <Icon name="plus" size={22} stroke={2.8} />
        </button>
      </div>
    </article>
  );
}
